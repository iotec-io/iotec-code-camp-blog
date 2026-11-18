import { useEffect, useRef, useState } from 'react'
import { useConvex, useQuery } from 'convex/react'
import {
  getFunctionName,
  type FunctionArgs,
  type FunctionReference,
  type FunctionReturnType,
} from 'convex/server'

interface RetainedQueryEntry {
  key: string
  lastResult: unknown
  activeConsumers: number
  unsubscribeWatch: (() => void) | null
  gcTimeoutId: number | null
  lastAccessedAt: number
}

const DEFAULT_GC_TIME_MS = 5 * 60 * 1000 // Keep reactive subscription warm for 5 minutes across route changes
const MAX_RETAINED_QUERIES = 40

const queryRegistry = new Map<string, RetainedQueryEntry>()

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`
  }
  const record = value as Record<string, unknown>
  const sortedKeys = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort()
  return `{${sortedKeys
    .map((k) => `${JSON.stringify(k)}:${stableSerialize(record[k])}`)
    .join(',')}}`
}

export function buildConvexQueryKey<Query extends FunctionReference<'query'>>(
  query: Query,
  args: FunctionArgs<Query>,
): string {
  const fnName = getFunctionName(query)
  return `${fnName}::${stableSerialize(args)}`
}

function disposeEntry(key: string) {
  const entry = queryRegistry.get(key)
  if (!entry) return
  if (entry.gcTimeoutId !== null && typeof window !== 'undefined') {
    window.clearTimeout(entry.gcTimeoutId)
  }
  if (entry.unsubscribeWatch) {
    entry.unsubscribeWatch()
  }
  queryRegistry.delete(key)
}

function enforceMaxRetainedLimit() {
  if (queryRegistry.size <= MAX_RETAINED_QUERIES) return

  const inactiveEntries = Array.from(queryRegistry.values())
    .filter((entry) => entry.activeConsumers === 0)
    .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)

  while (
    queryRegistry.size > MAX_RETAINED_QUERIES &&
    inactiveEntries.length > 0
  ) {
    const oldest = inactiveEntries.shift()
    if (oldest) {
      disposeEntry(oldest.key)
    }
  }
}

export interface UseCachedQueryOptions {
  /**
   * How long (in milliseconds) to keep the reactive Convex WebSocket subscription
   * alive in memory after the component unmounts or changes query arguments.
   * Defaults to 5 minutes (300,000 ms).
   */
  gcTimeMs?: number
  /**
   * When true (default), retains the last resolved data for the same query function
   * while new filter/search/pagination arguments are fetching, preventing loading flashes.
   */
  keepPreviousData?: boolean
}

/**
 * Reactive Convex query hook with subscription keep-alive caching and query keys.
 *
 * Why this prevents redundant refetches on navigation:
 * Standard `useQuery` immediately unsubscribes from Convex when a page unmounts,
 * evicting the cached result and forcing a full server re-run on remount.
 * `useCachedQuery` retains a background `watchQuery` subscription per query key
 * for `gcTimeMs` (5 min default). Because Convex subscriptions are push-based,
 * keeping the subscription warm costs zero extra database reads while idle,
 * stays 100% reactive to backend mutations, and renders instantaneously (0ms)
 * when navigating back to the page.
 */
export function useCachedQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: FunctionArgs<Query> | 'skip',
  options?: UseCachedQueryOptions,
): FunctionReturnType<Query> | undefined {
  const convex = useConvex()
  const gcTimeMs = options?.gcTimeMs ?? DEFAULT_GC_TIME_MS
  const keepPreviousData = options?.keepPreviousData ?? true

  const isSkipped = args === 'skip'
  const queryKey = isSkipped ? null : buildConvexQueryKey(query, args)

  // Live reactive subscription for the currently mounted component
  const liveResult = useQuery(
    query,
    ...(isSkipped ? ['skip'] : [args]) as unknown as [FunctionArgs<Query>],
  )

  // Synchronously read from the retained watch or registry if available on initial mount
  const cachedEntryResult = (() => {
    if (isSkipped || !queryKey) return undefined
    const existing = queryRegistry.get(queryKey)
    if (existing && existing.lastResult !== undefined) {
      return existing.lastResult as FunctionReturnType<Query>
    }
    try {
      const watch = (
        convex as unknown as {
          watchQuery: (
            q: Query,
            a: FunctionArgs<Query>,
          ) => { localQueryResult: () => FunctionReturnType<Query> | undefined }
        }
      ).watchQuery(query, args as FunctionArgs<Query>)
      return watch.localQueryResult()
    } catch {
      return undefined
    }
  })()

  const lastDefinedForQueryFnRef = useRef<
    FunctionReturnType<Query> | undefined
  >(liveResult ?? cachedEntryResult)

  const resolvedCurrent = liveResult ?? cachedEntryResult
  if (resolvedCurrent !== undefined) {
    lastDefinedForQueryFnRef.current = resolvedCurrent
  }

  // Trigger re-render if background watch updates before useQuery syncs
  const [, setTick] = useState(0)

  useEffect(() => {
    if (isSkipped || !queryKey) return

    let entry = queryRegistry.get(queryKey)
    if (!entry) {
      const watch = (
        convex as unknown as {
          watchQuery: (
            q: Query,
            a: FunctionArgs<Query>,
          ) => {
            onUpdate: (cb: () => void) => () => void
            localQueryResult: () => unknown
          }
        }
      ).watchQuery(query, args as FunctionArgs<Query>)

      entry = {
        key: queryKey,
        lastResult: watch.localQueryResult(),
        activeConsumers: 0,
        unsubscribeWatch: null,
        gcTimeoutId: null,
        lastAccessedAt: Date.now(),
      }

      const currentEntry = entry
      currentEntry.unsubscribeWatch = watch.onUpdate(() => {
        const nextVal = watch.localQueryResult()
        if (nextVal !== undefined) {
          currentEntry.lastResult = nextVal
          currentEntry.lastAccessedAt = Date.now()
          setTick((t) => t + 1)
        }
      })

      queryRegistry.set(queryKey, currentEntry)
      enforceMaxRetainedLimit()
    }

    if (entry.gcTimeoutId !== null && typeof window !== 'undefined') {
      window.clearTimeout(entry.gcTimeoutId)
      entry.gcTimeoutId = null
    }

    entry.activeConsumers += 1
    entry.lastAccessedAt = Date.now()

    return () => {
      const activeEntry = queryRegistry.get(queryKey)
      if (!activeEntry) return

      activeEntry.activeConsumers = Math.max(0, activeEntry.activeConsumers - 1)
      activeEntry.lastAccessedAt = Date.now()

      if (activeEntry.activeConsumers === 0 && typeof window !== 'undefined') {
        activeEntry.gcTimeoutId = window.setTimeout(() => {
          disposeEntry(queryKey)
        }, gcTimeMs)
      }
    }
  }, [convex, query, queryKey, isSkipped, gcTimeMs, args])

  // Keep registry entry's lastResult up to date whenever liveResult resolves
  useEffect(() => {
    if (!queryKey || liveResult === undefined) return
    const entry = queryRegistry.get(queryKey)
    if (entry) {
      entry.lastResult = liveResult
      entry.lastAccessedAt = Date.now()
    }
  }, [queryKey, liveResult])

  if (isSkipped) return undefined

  if (resolvedCurrent !== undefined) {
    return resolvedCurrent
  }

  if (keepPreviousData && lastDefinedForQueryFnRef.current !== undefined) {
    return lastDefinedForQueryFnRef.current
  }

  return undefined
}
