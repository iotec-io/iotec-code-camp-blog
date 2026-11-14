export type BlogCategory = 'Architecture' | 'Technology'

export interface BlogPost {
  id: string
  title: string
  subtitle: string
  excerpt: string
  category: BlogCategory
  badgeLabel: string
  date: string
  readTime: string
  isPaid: boolean
  priceLabel: string
  priceAmount: string
  imageUrl: string
  imageAlt: string
  imageCaption: string
  author: {
    name: string
    role: string
  }
  /**
   * Short teaser HTML shown when a paid article is locked.
   * The full article HTML is never mounted in the DOM while locked.
   */
  previewContentHtml: string
  /**
   * Complete rich-text HTML string saved from the rich text editor.
   * Contains paragraphs, bold, underline, colored text, blockquotes,
   * inline code, code blocks, and ordered/unordered lists.
   */
  fullContentHtml: string
}

const SHARED_AUTHOR = {
  name: 'Anne Ssubbi',
  role: 'Architect & Systems Engineer · The Tech Report',
} as const

export const MOCK_BLOGS: readonly BlogPost[] = [
  {
    id: 'building-software-that-outlives-us',
    title: 'Building Software That Outlives Us: Principles for Fifty-Year Software Systems',
    subtitle:
      'How deliberate constraints, plain-text protocols, and non-extractive architectures insulate creative work from technological decay.',
    excerpt:
      'Most digital architectures built today are designed with an expiration timestamp tacitly stamped into their foundations. To build something destined to stand for fifty years requires architectural refusal.',
    category: 'Architecture',
    badgeLabel: 'SYSTEMS & CRAFT',
    date: 'Nov 14, 2026',
    readTime: '14 min read',
    isPaid: true,
    priceLabel: 'Paid · UGX 9,500',
    priceAmount: 'UGX 9,500',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Cold-rack optic matrix at the East African Civic Ledger Archive',
    imageCaption:
      'Cold-rack optic matrix at the East African Civic Ledger Archive — Photographed by Nii Kotei, 2026',
    author: SHARED_AUTHOR,
    previewContentHtml: `
      <p class="drop-cap">Most digital architectures built today are designed with an <strong>expiration timestamp</strong> tacitly stamped into their foundations. They rely on cloud infrastructures that deprecate dependencies bi-annually, <u>telemetry layers that extract user sovereignty</u>, and venture models demanding endless churn over <span style="color: #1e5ae3; font-weight: 500;">quiet persistence</span>. When we open a book printed in Venice in 1502, the technology of movable type and linen rag paper remains immediately readable, self-contained, and impervious to platform decay.</p>
      <p>In contrast, a web page or digital tool authored barely a decade ago frequently fails to execute. Third-party script CDNs return <code>HTTP 404</code>, stylesheet frameworks abandon backwards compatibility, and proprietary database schemas trap authorial archives behind vanished corporate logins. To build something destined to stand for fifty years requires <u>rejecting the premise that software must continuously mutate</u> to maintain value.</p>
      <blockquote>
        <p>“Longevity is not an accident of good maintenance; it is an active discipline of architectural refusal.”</p>
        <cite>— THE VENICE STANDARD FOR LONG SOFTWARE (2023)</cite>
      </blockquote>
      <p>The foundational doctrine begins with simple, unambiguous <code>ASCII</code> and <code>UTF-8</code> streams. When an application communicates or persists records, it must never obscure that data behind binary black boxes or minified RPC protocols that require complex toolchains just to decipher plain text.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">Most digital architectures built today are designed with an <strong>expiration timestamp</strong> tacitly stamped into their foundations. They rely on cloud infrastructures that deprecate dependencies bi-annually, <u>telemetry layers that extract user sovereignty</u>, and venture models demanding endless churn over <span style="color: #1e5ae3; font-weight: 500;">quiet persistence</span>. When we open a book printed in Venice in 1502, the technology of movable type and linen rag paper remains immediately readable, self-contained, and impervious to platform decay.</p>
      <p>In contrast, a web page or digital tool authored barely a decade ago frequently fails to execute. Third-party script CDNs return <code>HTTP 404</code>, stylesheet frameworks abandon backwards compatibility, and proprietary database schemas trap authorial archives behind vanished corporate logins. To build something destined to stand for fifty years requires <u>rejecting the premise that software must continuously mutate</u> to maintain value.</p>
      <blockquote>
        <p>“Longevity is not an accident of good maintenance; it is an active discipline of architectural refusal.”</p>
        <cite>— THE VENICE STANDARD FOR LONG SOFTWARE (2023)</cite>
      </blockquote>
      <p>The foundational doctrine begins with simple, unambiguous <code>ASCII</code> and <code>UTF-8</code> streams. When an application communicates or persists records, it must never obscure that data behind binary black boxes or minified RPC protocols that require complex toolchains just to decipher plain text. In our field experiments documenting <span style="color: #9a5b42; font-weight: 600;">East African civic ledgers</span>, we enforced strict serialization rules.</p>
      <h2>1. The Four Pillars of Zero-Decay Architecture</h2>
      <p>Every module introduced into a long-horizon codebase must satisfy four non-negotiable engineering constraints before it is permitted into production:</p>
      <ul>
        <li><strong>Self-Contained Dependency Graph:</strong> Zero runtime calls to unpinned external microservices or ephemeral third-party scripts.</li>
        <li><strong>Human-Inspectable Storage:</strong> Every archival record must remain legible using standard <code>cat</code>, <code>grep</code>, or a basic SQLite shell fifty years from today.</li>
        <li><strong>Deterministic State Transitions:</strong> State mutations must be <span style="color: #166534; font-weight: 600;">idempotent and verifiable</span> via cryptographic content addressing.</li>
        <li><strong>Graceful Degradation:</strong> Interfaces must remain <u>fully navigable via keyboard and plain HTML</u> even when client scripts are stripped.</li>
      </ul>
      <h2>2. Verifiable Archival Envelope Specification</h2>
      <p>Below is the canonical header structure we use to seal each monograph in the Kampala cold-storage vault. Notice how the format pairs human-readable metadata headers with an immutable <code>SHA-256</code> content digest:</p>
      <pre><code>// archival-envelope.ts — Canonical 50-Year Dispatch Record
export interface ArchivalEnvelope {
  readonly schemaVersion: "1.0.0-static";
  readonly dispatchId: string;
  readonly authoredAtIso: string;
  readonly sha256Checksum: string;
  readonly payloadMimeType: "text/html; charset=utf-8";
}

export function verifyEnvelopeIntegrity(
  envelope: ArchivalEnvelope,
  computedHash: string
): boolean {
  return envelope.sha256Checksum === computedHash;
}</code></pre>
      <h2>3. Operational Checklist for Systems Authors</h2>
      <p>When migrating an existing publication or distributed ledger toward a <span style="color: #1e5ae3; font-weight: 600;">fifty-year durability horizon</span>, execute the following sequence in order:</p>
      <ol>
        <li>Audit and eliminate transitive runtime dependencies that have changed major versions more than twice in three years.</li>
        <li>Replace proprietary rich-text binary blobs with <u>canonical, semantic HTML strings</u> stored alongside plain-text summaries.</li>
        <li>Replicate snapshots across geographically independent cold-storage nodes with <strong>offline verification scripts</strong>.</li>
      </ol>
      <p>When we strip away performative complexity, software regains the calm permanence of well-joinered timber and stone.</p>
    `,
  },
  {
    id: 'quiet-computing-cognitive-silence',
    title: 'Quiet Computing & The Architecture of Cognitive Silence',
    subtitle:
      'An inquiry into computational environments that honor human attention spans, examining spatial interfaces and deliberate software restraint.',
    excerpt:
      'An inquiry into computational environments that honor human attention spans, examining spatial interfaces and deliberate software restraint.',
    category: 'Architecture',
    badgeLabel: 'ARCHITECTURE & FOCUS',
    date: 'Oct 24, 2026',
    readTime: '8 min read',
    isPaid: true,
    priceLabel: 'Paid · UGX 10,000',
    priceAmount: 'UGX 10,000',
    imageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Minimalist concrete and timber pavilion beside calm water in morning mist',
    imageCaption:
      'Acoustic study pavilion in Entebbe — Photographed for The Tech Report Archive, 2026',
    author: SHARED_AUTHOR,
    previewContentHtml: `
      <p class="drop-cap">Modern operating systems treat human attention as an <strong>infinite, unpriced commons</strong>. Notifications interrupt deep synthesis, status badges pulse in peripheral vision, and background daemons compete for cycles without consent. <u>Quiet computing</u> begins by inverting this hierarchy: the machine waits silently until summoned.</p>
      <p>In architectural acoustics, a room is evaluated by its noise floor and reverberation decay. Software environments require an equivalent metric for <span style="color: #1e5ae3; font-weight: 500;">cognitive reverberation</span>—the time required for an engineer’s mind to regain focus after an uninvited modal dialog appears.</p>
      <blockquote>
        <p>“The most respectful interface is the one that leaves no trace on your nervous system once the task is complete.”</p>
        <cite>— NOTES ON DIGITAL ERGONOMICS (2025)</cite>
      </blockquote>
      <p>By restricting visual chrome to monochromatic planes and reserving saturated color strictly for <code>explicit user-initiated states</code>, we reduce visual fatigue across twelve-hour drafting sessions.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">Modern operating systems treat human attention as an <strong>infinite, unpriced commons</strong>. Notifications interrupt deep synthesis, status badges pulse in peripheral vision, and background daemons compete for cycles without consent. <u>Quiet computing</u> begins by inverting this hierarchy: the machine waits silently until summoned.</p>
      <p>In architectural acoustics, a room is evaluated by its noise floor and reverberation decay. Software environments require an equivalent metric for <span style="color: #1e5ae3; font-weight: 500;">cognitive reverberation</span>—the time required for an engineer’s mind to regain focus after an uninvited modal dialog appears.</p>
      <blockquote>
        <p>“The most respectful interface is the one that leaves no trace on your nervous system once the task is complete.”</p>
        <cite>— NOTES ON DIGITAL ERGONOMICS (2025)</cite>
      </blockquote>
      <p>By restricting visual chrome to monochromatic planes and reserving saturated color strictly for <code>explicit user-initiated states</code>, we reduce visual fatigue across twelve-hour drafting sessions.</p>
      <h2>Designing for Zero Unsolicited Motion</h2>
      <ul>
        <li><strong>Synchronous Pull over Asynchronous Push:</strong> Status updates are fetched when the reader opens the ledger, never injected mid-sentence.</li>
        <li><strong>High-Contrast Typography:</strong> Warm paper backgrounds (<code>#fcfbf9</code>) paired with deep ink serif letterforms prevent halation.</li>
        <li><strong>Predictable Spatial Memory:</strong> Navigation landmarks remain <u>anchored in fixed coordinates</u> so muscle memory never misfires.</li>
      </ul>
      <pre><code>// quiet-scheduler.ts — Suppresses non-critical UI interrupts
export function scheduleQuietNotification(isDeepWorkActive: boolean, message: string) {
  if (isDeepWorkActive) {
    return { deferred: true, queuedAt: Date.now(), message };
  }
  return { deferred: false, deliveredAt: Date.now(), message };
}</code></pre>
    `,
  },
  {
    id: 'tactile-typography-modern-os',
    title: 'Tactile Typography in Modern Operating Systems',
    subtitle:
      'Exploring physical typesetting traditions to revitalize the clinical sterility of contemporary desktop typography and high-density displays.',
    excerpt:
      'Exploring physical typesetting traditions to revitalize the clinical sterility of contemporary desktop typography and high-density displays.',
    category: 'Technology',
    badgeLabel: 'TYPOGRAPHY & SYSTEMS',
    date: 'Nov 02, 2026',
    readTime: '5 min read',
    isPaid: false,
    priceLabel: 'Free',
    priceAmount: 'Free',
    imageUrl:
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Traditional movable metal letterpress type blocks arranged on a wooden workbench',
    imageCaption:
      'Foundry matrices and optical size specimens — Archival Plate IV, 2026',
    author: SHARED_AUTHOR,
    previewContentHtml: `
      <p class="drop-cap">When punchcutters in the sixteenth century carved steel matrices by hand, they did not merely scale a single vector outline linearly from <code>8pt</code> to <code>48pt</code>. They adjusted stroke contrast, widened counters, and opened apertures at smaller optical sizes so ink spread on damp paper would not choke the letterform.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">When punchcutters in the sixteenth century carved steel matrices by hand, they did not merely scale a single vector outline linearly from <code>8pt</code> to <code>48pt</code>. They adjusted stroke contrast, widened counters, and opened apertures at smaller optical sizes so ink spread on damp paper would not choke the letterform.</p>
      <p>For decades, early bitmap and vector rasterizers flattened this nuance into uniform geometric curves. Today, with high-density subpixel rendering and <u>variable optical-sizing axes</u> (<code>font-optical-sizing: auto</code>), digital prose can finally reclaim the <span style="color: #1e5ae3; font-weight: 600;">tactile warmth of physical type</span>.</p>
      <blockquote>
        <p>“A paragraph is an architectural courtyard: the line height is the proportion of sky visible between the eaves.”</p>
        <cite>— ESSAYS ON COMPUTATIONAL TYPESETTING (2026)</cite>
      </blockquote>
      <h2>Key Optical Parameters for Long-Form Reading</h2>
      <ul>
        <li><strong>Measure Constraint:</strong> Maintain line lengths strictly between <strong>60 and 72 characters</strong> to minimize ocular saccade fatigue.</li>
        <li><strong>Optical Size Axis (<code>opsz</code>):</strong> Bind body copy to <code>14pt–16pt</code> optical cuts and headlines to high-contrast <code>48pt+</code> display cuts.</li>
        <li><strong>Semantic Emphasis:</strong> Combine <u>underlined key clauses</u>, <strong>bold structural anchors</strong>, and <span style="color: #9a5b42; font-weight: 600;">warm terracotta highlights</span> sparingly.</li>
      </ul>
      <pre><code>/* Optimal editorial prose rhythm */
.editorial-prose {
  font-optical-sizing: auto;
  line-height: 1.75;
  max-inline-size: 65ch;
  text-rendering: optimizeLegibility;
}</code></pre>
      <h2>Verification Sequence</h2>
      <ol>
        <li>Test body paragraphs at 100%, 125%, and 150% viewport zoom levels.</li>
        <li>Verify that inline <code>code fragments</code> match the x-height of surrounding serif words.</li>
        <li>Confirm contrast ratios exceed <strong>7:1 AAA</strong> across all ambient lighting conditions.</li>
      </ol>
    `,
  },
  {
    id: 'distributed-topology-outlast-frenzy',
    title: 'Distributed Topology: Engineering Built to Outlast Frenzy',
    subtitle:
      'Lessons drawn from resilient decentralized infrastructure operating across bandwidth-constrained networks in East Africa.',
    excerpt:
      'Lessons drawn from resilient decentralized infrastructure operating across bandwidth-constrained networks in East Africa.',
    category: 'Architecture',
    badgeLabel: 'DISTRIBUTED SYSTEMS',
    date: 'Nov 14, 2026',
    readTime: '12 min read',
    isPaid: true,
    priceLabel: 'Paid · UGX 5,000',
    priceAmount: 'UGX 5,000',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Illuminated server rack cabling inside a dark data center',
    imageCaption:
      'Regional mesh relay node in Kampala — Photographed by Nii Kotei, 2026',
    author: SHARED_AUTHOR,
    previewContentHtml: `
      <p class="drop-cap">When engineers design distributed systems solely inside gigabit fiber campuses, they unconsciously treat network partitions as <strong>rare anomalies</strong> rather than the default operating state. Across regional corridors in East Africa, intermittent link saturation is a daily physical reality that exposes fragile consensus assumptions within minutes.</p>
      <blockquote>
        <p>“Resilience is measured not when every fiber link is lit, but when three regional relays go dark simultaneously and local nodes continue settling transactions.”</p>
        <cite>— KAMPALA SYSTEMS SYMPOSIUM (2026)</cite>
      </blockquote>
      <p>By designing around <u>local-first append-only logs</u> and compact delta synchronization, nodes remain <span style="color: #1e5ae3; font-weight: 500;">autonomous for weeks</span> without upstream coordination.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">When engineers design distributed systems solely inside gigabit fiber campuses, they unconsciously treat network partitions as <strong>rare anomalies</strong> rather than the default operating state. Across regional corridors in East Africa, intermittent link saturation is a daily physical reality that exposes fragile consensus assumptions within minutes.</p>
      <blockquote>
        <p>“Resilience is measured not when every fiber link is lit, but when three regional relays go dark simultaneously and local nodes continue settling transactions.”</p>
        <cite>— KAMPALA SYSTEMS SYMPOSIUM (2026)</cite>
      </blockquote>
      <p>By designing around <u>local-first append-only logs</u> and compact delta synchronization, nodes remain <span style="color: #1e5ae3; font-weight: 500;">autonomous for weeks</span> without upstream coordination.</p>
      <h2>Partition-Tolerant Replication Protocol</h2>
      <ul>
        <li><strong>Causal Vector Clocks:</strong> Track causality across offline branches without requiring a central coordinator.</li>
        <li><strong>Deterministic Merge Functions:</strong> Conflict-free replicated data types (<code>CRDTs</code>) guarantee convergence once links heal.</li>
      </ul>
      <pre><code>export function mergeVectorClocks(
  local: Record<string, number>,
  remote: Record<string, number>
): Record<string, number> {
  const merged = { ...local };
  for (const [node, counter] of Object.entries(remote)) {
    merged[node] = Math.max(merged[node] ?? 0, counter);
  }
  return merged;
}</code></pre>
    `,
  },
  {
    id: 'anatomy-of-resilient-distributed-systems',
    title: 'The Anatomy of Resilient Distributed Systems',
    subtitle:
      'Why modern hyper-scaled topologies frequently collapse under synchronous cascading locks, and how adopting asynchronous partition boundaries creates calm.',
    excerpt:
      'Why modern hyper-scaled topologies frequently collapse under synchronous cascading locks, and how adopting asynchronous partition boundaries creates calm.',
    category: 'Architecture',
    badgeLabel: 'SYSTEMS ARCHITECTURE',
    date: 'Nov 21, 2026',
    readTime: '10 min read',
    isPaid: false,
    priceLabel: 'Free',
    priceAmount: 'Free',
    imageUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Sunlit brutalist concrete interior with timber ceiling beams and staircase',
    imageCaption:
      'Structural load-isolation study — Architectural Monograph Series, 2026',
    author: SHARED_AUTHOR,
    previewContentHtml: `
      <p class="drop-cap">Cascading failures in distributed systems almost always trace back to a single architectural sin: <strong>unbounded synchronous waiting</strong> across fault domains.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">Cascading failures in distributed systems almost always trace back to a single architectural sin: <strong>unbounded synchronous waiting</strong> across fault domains. When Service A blocks a thread awaiting Service B, which in turn blocks awaiting Service C, the latency of the entire topology degrades to its slowest tail percentile.</p>
      <blockquote>
        <p>“Bulkheads in a ship do not prevent water from entering a breached hull; they prevent one flooded compartment from sinking the vessel.”</p>
        <cite>— FAULT-TOLERANT TOPOLOGIES (2026)</cite>
      </blockquote>
      <h2>Core Isolation Techniques</h2>
      <ul>
        <li><strong>Strict Queue Bounds:</strong> Reject excess load at the perimeter with explicit <code>HTTP 429</code> backpressure rather than queuing until memory exhausts.</li>
        <li><strong>Asynchronous Event Journals:</strong> Decouple write acknowledgement from downstream projection workers using <u>durable ring buffers</u>.</li>
        <li><strong>Circuit Breakers with Jitter:</strong> Prevent <span style="color: #dc2626; font-weight: 600;">thundering herd retry storms</span> during recovery windows.</li>
      </ul>
      <pre><code>export function computeBackoffWithJitter(attempt: number, baseMs = 200): number {
  const exponential = baseMs * Math.pow(2, Math.min(attempt, 6));
  const jitter = Math.floor(Math.random() * baseMs);
  return exponential + jitter;
}</code></pre>
    `,
  },
  {
    id: 'memory-allocations-bare-metal',
    title: 'Memory Allocations in Bare-Metal Embedded Runtimes',
    subtitle:
      'Deterministic arena allocators, zero-copy ring buffers, and the craft of writing predictable systems software that runs for decades without rebooting.',
    excerpt:
      'Deterministic arena allocators, zero-copy ring buffers, and the craft of writing predictable systems software that runs for decades without rebooting.',
    category: 'Technology',
    badgeLabel: 'SYSTEMS & CRAFT',
    date: 'Nov 29, 2026',
    readTime: '9 min read',
    isPaid: true,
    priceLabel: 'Paid · UGX 8,000',
    priceAmount: 'UGX 8,000',
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Macro photograph of precision circuit board traces and microcontrollers',
    imageCaption:
      'Embedded telemetry controller board — Hardware Verification Lab, 2026',
    author: SHARED_AUTHOR,
    previewContentHtml: `
      <p class="drop-cap">In safety-critical and long-lived embedded systems, general-purpose heap allocation (<code>malloc</code> / <code>free</code>) after initialization is treated as a <strong>latent defect</strong>. Over months of continuous operation, variable-sized allocations fragment physical RAM until a routine request fails unpredictably.</p>
      <blockquote>
        <p>“If you know the upper bound of your workload at compile time, pre-allocate the arena once at boot and never ask the allocator again.”</p>
        <cite>— BARE-METAL SYSTEMS MANUAL (2026)</cite>
      </blockquote>
      <p>Using <u>fixed-capacity arena allocators</u> and <span style="color: #1e5ae3; font-weight: 500;">zero-copy ring buffers</span> guarantees <code>O(1)</code> allocation latency.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">In safety-critical and long-lived embedded systems, general-purpose heap allocation (<code>malloc</code> / <code>free</code>) after initialization is treated as a <strong>latent defect</strong>. Over months of continuous operation, variable-sized allocations fragment physical RAM until a routine request fails unpredictably.</p>
      <blockquote>
        <p>“If you know the upper bound of your workload at compile time, pre-allocate the arena once at boot and never ask the allocator again.”</p>
        <cite>— BARE-METAL SYSTEMS MANUAL (2026)</cite>
      </blockquote>
      <p>Using <u>fixed-capacity arena allocators</u> and <span style="color: #1e5ae3; font-weight: 500;">zero-copy ring buffers</span> guarantees <code>O(1)</code> allocation latency.</p>
      <pre><code>export class LinearArena {
  private offset = 0;
  constructor(private readonly capacityBytes: number) {}

  allocate(sizeBytes: number): number | null {
    if (this.offset + sizeBytes > this.capacityBytes) return null;
    const ptr = this.offset;
    this.offset += sizeBytes;
    return ptr;
  }

  reset(): void {
    this.offset = 0;
  }
}</code></pre>
    `,
  },
] as const

export type BlogPostPreview = BlogPost

/**
 * Returns only the permitted HTML content for a blog post.
 * When a blog is paid and not unlocked, the full HTML is withheld so it is never
 * rendered or inspectable in the DOM even if the paywall dialog is removed in DevTools.
 */
export function getAuthorizedBlogHtml(blog: BlogPost, isUnlocked: boolean): string {
  if (blog.isPaid && !isUnlocked) {
    return blog.previewContentHtml
  }
  return blog.fullContentHtml
}
