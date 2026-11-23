import { v, ConvexError } from "convex/values";
import {
  env,
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  blogCategoryValidator,
  blogStatusValidator,
  subscriptionModeValidator,
} from "./schema";

const priceValidator = v.object({
  amount: v.number(),
  currency: v.string(),
});

const coverImageDataValidator = v.object({
  alt: v.string(),
  caption: v.string(),
  fileName: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  dimensions: v.optional(v.string()),
});

const authorValidator = v.object({
  id: v.string(),
  name: v.string(),
  role: v.string(),
});

const publicBlogItemValidator = v.object({
  _id: v.id("blogs"),
  _creationTime: v.number(),
  slug: v.string(),
  title: v.string(),
  subtitle: v.string(),
  excerpt: v.string(),
  category: blogCategoryValidator,
  tags: v.optional(v.array(v.string())),
  badgeLabel: v.string(),
  date: v.string(),
  readTime: v.string(),
  wordCount: v.number(),
  status: blogStatusValidator,
  subscriptionMode: subscriptionModeValidator,
  isPaid: v.boolean(),
  price: priceValidator,
  paymentCurrency: v.union(v.literal("ITX"), v.literal("UGX"), v.null()),
  priceLabel: v.string(),
  priceAmount: v.string(),
  coverImageStorageId: v.optional(v.id("_storage")),
  coverImageUrl: v.string(),
  coverImageData: coverImageDataValidator,
  imageUrl: v.string(),
  imageAlt: v.string(),
  imageCaption: v.string(),
  author: authorValidator,
  updatedAt: v.number(),
});

const blogDetailsResponseValidator = v.union(
  v.null(),
  publicBlogItemValidator.extend({
    authorizedHtml: v.string(),
    hasAccess: v.boolean(),
    fullContentHtmlForEdit: v.optional(v.string()),
  }),
);

const DEFAULT_AUTHOR = {
  id: "author-anne-ssubbi",
  name: "Anne Ssubbi",
  role: "Architect & Systems Engineer · The Tech Report",
} as const;

function formatCurrencyAmount(amount: number): string {
  return amount.toLocaleString("en-US");
}

function formatDateFromTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

async function resolveCoverImageUrl(
  ctx: QueryCtx,
  doc: Doc<"blogs">,
): Promise<string> {
  if (doc.coverImageStorageId) {
    const signedUrl = await ctx.storage.getUrl(doc.coverImageStorageId);
    if (signedUrl) return signedUrl;
  }
  return (
    doc.coverImageUrl ??
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85"
  );
}

async function toPublicBlogItem(ctx: QueryCtx, doc: Doc<"blogs">) {
  const resolvedImageUrl = await resolveCoverImageUrl(ctx, doc);
  const isPaid = doc.subscriptionMode === "paid";
  const paymentCurrency = env.IOTEC_PAY_CURRENCY ?? null;
  const currency = paymentCurrency ?? (doc.price.currency || "UGX");
  const formattedPrice = `${currency} ${formatCurrencyAmount(doc.price.amount)}`;
  const priceLabel = isPaid ? `Paid · ${formattedPrice}` : "Free";
  const priceAmount = isPaid ? formattedPrice : "Free";
  const badgeLabel =
    doc.tags?.[0] ??
    (doc.category === "Architecture"
      ? "SYSTEMS & ARCHITECTURE"
      : "TECHNOLOGY & CRAFT");

  return {
    _id: doc._id,
    _creationTime: doc._creationTime,
    slug: doc.slug,
    title: doc.title,
    subtitle: doc.subtitle,
    excerpt: doc.excerpt,
    category: doc.category,
    tags: doc.tags,
    badgeLabel,
    date: formatDateFromTimestamp(doc.updatedAt || doc._creationTime),
    readTime: doc.readTime,
    wordCount: doc.wordCount,
    status: doc.status,
    subscriptionMode: doc.subscriptionMode,
    isPaid,
    price: { ...doc.price, currency },
    paymentCurrency,
    priceLabel,
    priceAmount,
    coverImageStorageId: doc.coverImageStorageId,
    coverImageUrl: resolvedImageUrl,
    coverImageData: doc.coverImageData,
    imageUrl: resolvedImageUrl,
    imageAlt: doc.coverImageData.alt,
    imageCaption: doc.coverImageData.caption,
    author: doc.author ?? DEFAULT_AUTHOR,
    updatedAt: doc.updatedAt,
  };
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, "—")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPreviewHtml(fullHtml: string): string {
  const trimmed = fullHtml.trim();
  if (!trimmed) return "<p></p>";

  const blockMatches = trimmed.match(
    /<(p|blockquote|h2|h3|ul|ol|pre)[\s\S]*?<\/\1>/gi,
  );
  if (blockMatches && blockMatches.length > 0) {
    const previewBlocks = blockMatches.slice(0, 3);
    if (
      previewBlocks[0] &&
      previewBlocks[0].startsWith("<p>") &&
      !previewBlocks[0].includes("drop-cap")
    ) {
      previewBlocks[0] = previewBlocks[0].replace(
        "<p>",
        '<p class="drop-cap">',
      );
    }
    return previewBlocks.join("\n");
  }

  return `<p class="drop-cap">${stripHtmlTags(trimmed).slice(0, 420)}...</p>`;
}

function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base || `dispatch-${Date.now()}`;
}

export const listPublished = query({
  args: {
    category: v.optional(blogCategoryValidator),
  },
  returns: v.array(publicBlogItemValidator),
  handler: async (ctx, args) => {
    const docs = args.category
      ? await ctx.db
          .query("blogs")
          .withIndex("by_status_and_category", (q) =>
            q.eq("status", "published").eq("category", args.category!),
          )
          .order("desc")
          .take(50)
      : await ctx.db
          .query("blogs")
          .withIndex("by_status", (q) => q.eq("status", "published"))
          .order("desc")
          .take(50);

    return await Promise.all(docs.map((doc) => toPublicBlogItem(ctx, doc)));
  },
});

export const listAllForAdmin = query({
  args: {},
  returns: v.array(publicBlogItemValidator),
  handler: async (ctx) => {
    const docs = await ctx.db.query("blogs").order("desc").take(100);
    return await Promise.all(docs.map((doc) => toPublicBlogItem(ctx, doc)));
  },
});

/**
 * Reactive server-side search, multi/single filter, and paginated query for the Admin Blogs table.
 */
export const listAdminTable = query({
  args: {
    searchQuery: v.optional(v.string()),
    categories: v.optional(v.array(blogCategoryValidator)),
    subscriptionModes: v.optional(v.array(subscriptionModeValidator)),
    statuses: v.optional(v.array(blogStatusValidator)),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  returns: v.object({
    items: v.array(publicBlogItemValidator),
    totalFiltered: v.number(),
    page: v.number(),
    pageSize: v.number(),
    totalPages: v.number(),
    counts: v.object({
      published: v.number(),
      draft: v.number(),
      archived: v.number(),
      total: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const allDocs = await ctx.db.query("blogs").order("desc").take(200);

    let publishedCount = 0;
    let draftCount = 0;
    let archivedCount = 0;

    for (const doc of allDocs) {
      if (doc.status === "published") publishedCount += 1;
      else if (doc.status === "draft") draftCount += 1;
      else if (doc.status === "archived") archivedCount += 1;
    }

    const normalizedSearch = args.searchQuery?.trim().toLowerCase() ?? "";
    const categorySet =
      args.categories && args.categories.length > 0
        ? new Set(args.categories)
        : null;
    const subscriptionSet =
      args.subscriptionModes && args.subscriptionModes.length > 0
        ? new Set(args.subscriptionModes)
        : null;
    const statusSet =
      args.statuses && args.statuses.length > 0 ? new Set(args.statuses) : null;

    const filteredDocs = allDocs.filter((doc) => {
      if (categorySet && !categorySet.has(doc.category)) {
        return false;
      }
      if (subscriptionSet && !subscriptionSet.has(doc.subscriptionMode)) {
        return false;
      }
      if (statusSet && !statusSet.has(doc.status)) {
        return false;
      }
      if (normalizedSearch) {
        const inTitle = doc.title.toLowerCase().includes(normalizedSearch);
        const inSubtitle = doc.subtitle
          .toLowerCase()
          .includes(normalizedSearch);
        const inCategory = doc.category
          .toLowerCase()
          .includes(normalizedSearch);
        const inTags = (doc.tags ?? []).some((tag) =>
          tag.toLowerCase().includes(normalizedSearch),
        );
        if (!inTitle && !inSubtitle && !inCategory && !inTags) {
          return false;
        }
      }
      return true;
    });

    const pageSize = Math.max(1, Math.min(args.pageSize ?? 7, 50));
    const totalFiltered = filteredDocs.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const requestedPage = Math.max(1, args.page ?? 1);
    const currentPage = Math.min(requestedPage, totalPages);

    const startIndex = (currentPage - 1) * pageSize;
    const pageDocs = filteredDocs.slice(startIndex, startIndex + pageSize);

    const items = await Promise.all(
      pageDocs.map((doc) => toPublicBlogItem(ctx, doc)),
    );

    return {
      items,
      totalFiltered,
      page: currentPage,
      pageSize,
      totalPages,
      counts: {
        published: publishedCount,
        draft: draftCount,
        archived: archivedCount,
        total: allDocs.length,
      },
    };
  },
});

export const getByIdOrSlug = query({
  args: {
    identifier: v.optional(v.string()),
    accessKey: v.optional(v.string()),
  },
  returns: blogDetailsResponseValidator,
  handler: async (ctx, args) => {
    let doc: Doc<"blogs"> | null = null;

    if (args.identifier) {
      const normalizedId = ctx.db.normalizeId("blogs", args.identifier);
      if (normalizedId) {
        doc = await ctx.db.get(normalizedId);
      }
      if (!doc) {
        doc = await ctx.db
          .query("blogs")
          .withIndex("by_slug", (q) => q.eq("slug", args.identifier!))
          .unique();
      }
    }

    if (!doc) {
      const fallbackDocs = await ctx.db
        .query("blogs")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .order("desc")
        .take(1);
      doc = fallbackDocs[0] ?? null;
    }

    if (!doc) return null;

    const baseItem = await toPublicBlogItem(ctx, doc);
    const isPaid = doc.subscriptionMode === "paid";
    const accessId = args.accessKey
      ? ctx.db.normalizeId("transactions", args.accessKey)
      : null;
    const access = accessId ? await ctx.db.get(accessId) : null;
    const canViewFull = !isPaid ||
      (access?.blogId === doc._id &&
        access.transactionType === "subscription" &&
        access.status === "completed");

    return {
      ...baseItem,
      hasAccess: canViewFull,
      authorizedHtml: canViewFull ? doc.fullContentHtml : doc.previewContentHtml,
      fullContentHtmlForEdit: (!isPaid || doc.status !== "published")
        ? doc.fullContentHtml
        : undefined,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveBlog = mutation({
  args: {
    blogId: v.optional(v.id("blogs")),
    title: v.string(),
    subtitle: v.string(),
    category: blogCategoryValidator,
    tags: v.optional(v.array(v.string())),
    subscriptionMode: subscriptionModeValidator,
    price: priceValidator,
    status: blogStatusValidator,
    fullContentHtml: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    coverImageData: coverImageDataValidator,
    author: v.optional(authorValidator),
  },
  returns: v.object({
    blogId: v.id("blogs"),
    slug: v.string(),
    status: blogStatusValidator,
  }),
  handler: async (ctx, args) => {
    const trimmedTitle = args.title.trim();
    const trimmedSubtitle = args.subtitle.trim();
    const plainBody = stripHtmlTags(args.fullContentHtml);

    if (!trimmedTitle || trimmedTitle.length > 100) {
      throw new ConvexError(
        "Blog title is required and must be at most 100 characters.",
      );
    }

    if (!trimmedSubtitle || trimmedSubtitle.length > 250) {
      throw new ConvexError(
        "Subtitle is required and must be at most 250 characters.",
      );
    }

    if (!plainBody) {
      throw new ConvexError("Manuscript & body text is required.");
    }

    const words = plainBody.split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    const readTime = `${readMinutes} min read`;

    const isPaid = args.subscriptionMode === "paid";
    const normalizedPrice = {
      amount: isPaid ? Math.max(500, args.price.amount) : 0,
      currency: args.price.currency || "UGX",
    };

    const normalizedFullHtml =
      args.fullContentHtml.includes("drop-cap") ||
      !args.fullContentHtml.includes("<p>")
        ? args.fullContentHtml
        : args.fullContentHtml.replace("<p>", '<p class="drop-cap">');

    const previewContentHtml = buildPreviewHtml(normalizedFullHtml);
    const excerpt =
      trimmedSubtitle.length > 160
        ? `${trimmedSubtitle.slice(0, 157)}...`
        : trimmedSubtitle;

    const defaultTags =
      args.tags && args.tags.length > 0
        ? args.tags
        : [
            args.category === "Architecture"
              ? "SYSTEMS & ARCHITECTURE"
              : "TECHNOLOGY & CRAFT",
          ];

    if (args.blogId) {
      const existing = await ctx.db.get(args.blogId);
      if (!existing) {
        throw new ConvexError("Blog draft not found.");
      }
      if (existing.status === "published" && existing.subscriptionMode === "paid") {
        throw new ConvexError(
          "Published paid blogs cannot be edited until admin authentication is configured.",
        );
      }

      const nextCoverStorageId =
        args.coverImageStorageId ?? existing.coverImageStorageId;
      const nextCoverImageUrl = args.coverImageUrl ?? existing.coverImageUrl;

      if (!nextCoverStorageId && !nextCoverImageUrl) {
        throw new ConvexError(
          args.status === "published"
            ? "A blog cannot be published without a cover image."
            : "A cover image is required to save the blog.",
        );
      }

      await ctx.db.patch(args.blogId, {
        title: trimmedTitle,
        subtitle: trimmedSubtitle,
        excerpt,
        previewContentHtml,
        fullContentHtml: normalizedFullHtml,
        category: args.category,
        tags: defaultTags,
        readTime,
        wordCount: words,
        status: args.status,
        subscriptionMode: args.subscriptionMode,
        price: normalizedPrice,
        coverImageStorageId: nextCoverStorageId,
        coverImageUrl: nextCoverImageUrl,
        coverImageData: {
          alt: args.coverImageData.alt.trim() || trimmedTitle,
          caption:
            args.coverImageData.caption.trim() ||
            `${trimmedTitle} — Archival Plate, The Tech Report`,
          fileName:
            args.coverImageData.fileName ?? existing.coverImageData.fileName,
          fileSize:
            args.coverImageData.fileSize ?? existing.coverImageData.fileSize,
          dimensions:
            args.coverImageData.dimensions ??
            existing.coverImageData.dimensions,
        },
        author: args.author ?? existing.author ?? DEFAULT_AUTHOR,
        updatedAt: Date.now(),
      });

      return {
        blogId: args.blogId,
        slug: existing.slug,
        status: args.status,
      };
    }

    if (!args.coverImageStorageId && !args.coverImageUrl) {
      throw new ConvexError(
        args.status === "published"
          ? "A blog cannot be published without a cover image."
          : "A cover image is required to save the blog.",
      );
    }

    const baseSlug = slugifyTitle(trimmedTitle);
    const existingWithSlug = await ctx.db
      .query("blogs")
      .withIndex("by_slug", (q) => q.eq("slug", baseSlug))
      .unique();
    const slug = existingWithSlug
      ? `${baseSlug}-${Date.now().toString(36)}`
      : baseSlug;

    const blogId = await ctx.db.insert("blogs", {
      slug,
      title: trimmedTitle,
      subtitle: trimmedSubtitle,
      excerpt,
      previewContentHtml,
      fullContentHtml: normalizedFullHtml,
      category: args.category,
      tags: defaultTags,
      readTime,
      wordCount: words,
      status: args.status,
      subscriptionMode: args.subscriptionMode,
      price: normalizedPrice,
      coverImageStorageId: args.coverImageStorageId,
      coverImageUrl: args.coverImageUrl,
      coverImageData: {
        alt: args.coverImageData.alt.trim() || trimmedTitle,
        caption:
          args.coverImageData.caption.trim() ||
          `${trimmedTitle} — Archival Plate, The Tech Report`,
        fileName: args.coverImageData.fileName,
        fileSize: args.coverImageData.fileSize,
        dimensions: args.coverImageData.dimensions,
      },
      author: args.author ?? DEFAULT_AUTHOR,
      updatedAt: Date.now(),
    });

    return {
      blogId,
      slug,
      status: args.status,
    };
  },
});

const INITIAL_SEED_BLOGS = [
  {
    slug: "building-software-that-outlives-us",
    title:
      "Building Software That Outlives Us: Principles for Fifty-Year Software Systems",
    subtitle:
      "How deliberate constraints, plain-text protocols, and non-extractive architectures insulate creative work from technological decay.",
    excerpt:
      "Most digital architectures built today are designed with an expiration timestamp tacitly stamped into their foundations. To build something destined to stand for fifty years requires architectural refusal.",
    category: "Architecture" as const,
    tags: ["SYSTEMS & CRAFT", "LONGEVITY"],
    readTime: "14 min read",
    wordCount: 420,
    status: "published" as const,
    subscriptionMode: "paid" as const,
    price: {
      amount: 9500,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Cold-rack optic matrix at the East African Civic Ledger Archive",
      caption:
        "Cold-rack optic matrix at the East African Civic Ledger Archive — Photographed by Nii Kotei, 2026",
      fileName: "civic_ledger_optic_matrix.webp",
      fileSize: 2411724,
      dimensions: "2400 × 1350",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-10-14T10:00:00Z"),
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
    slug: "quiet-computing-cognitive-silence",
    title: "Quiet Computing & The Architecture of Cognitive Silence",
    subtitle:
      "An inquiry into computational environments that honor human attention spans, examining spatial interfaces and deliberate software restraint.",
    excerpt:
      "An inquiry into computational environments that honor human attention spans, examining spatial interfaces and deliberate software restraint.",
    category: "Architecture" as const,
    tags: ["ARCHITECTURE & FOCUS"],
    readTime: "8 min read",
    wordCount: 310,
    status: "published" as const,
    subscriptionMode: "paid" as const,
    price: {
      amount: 10000,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Minimalist concrete and timber pavilion beside calm water in morning mist",
      caption:
        "Acoustic study pavilion in Entebbe — Photographed for The Tech Report Archive, 2026",
      fileName: "entebbe_acoustic_pavilion.webp",
      fileSize: 1984120,
      dimensions: "2400 × 1350",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-09-28T10:00:00Z"),
    previewContentHtml: `
      <p class="drop-cap">Modern operating systems treat human attention as an <strong>infinite, unpriced commons</strong>. Notifications interrupt deep synthesis, status badges pulse in peripheral vision, and background daemons compete for cycles without consent. <u>Quiet computing</u> begins by inverting this hierarchy: the machine waits silently until summoned.</p>
      <p>In architectural acoustics, a room is evaluated by its noise floor and reverberation decay. Software environments require an equivalent metric for <span style="color: #1e5ae3; font-weight: 500;">cognitive reverberation</span>—the time required for an engineer’s mind to regain focus after an uninvited modal dialog appears.</p>
      <blockquote>
        <p>“The most respectful interface is the one that leaves no trace on your nervous system once the task is complete.”</p>
        <cite>— NOTES ON DIGITAL ERGONOMICS (2025)</cite>
      </blockquote>
    `,
    fullContentHtml: `
      <p class="drop-cap">Modern operating systems treat human attention as an <strong>infinite, unpriced commons</strong>. Notifications interrupt deep synthesis, status badges pulse in peripheral vision, and background daemons compete for cycles without consent. <u>Quiet computing</u> begins by inverting this hierarchy: the machine waits silently until summoned.</p>
      <p>In architectural acoustics, a room is evaluated by its noise floor and reverberation decay. Software environments require an equivalent metric for <span style="color: #1e5ae3; font-weight: 500;">cognitive reverberation</span>—the time required for an engineer’s mind to regain focus after an uninvited modal dialog appears.</p>
      <blockquote>
        <p>“The most respectful interface is the one that leaves no trace on your nervous system once the task is complete.”</p>
        <cite>— NOTES ON DIGITAL ERGONOMICS (2025)</cite>
      </blockquote>
      <h2>Designing for Zero Unsolicited Motion</h2>
      <ul>
        <li><strong>Synchronous Pull over Asynchronous Push:</strong> Status updates are fetched when the reader opens the ledger, never injected mid-sentence.</li>
        <li><strong>High-Contrast Typography:</strong> Warm paper backgrounds (<code>#fcfbf9</code>) paired with deep ink serif letterforms prevent halation.</li>
        <li><strong>Predictable Spatial Memory:</strong> Navigation landmarks remain <u>anchored in fixed coordinates</u> so muscle memory never misfires.</li>
      </ul>
      <pre><code>export function scheduleQuietNotification(isDeepWorkActive: boolean, message: string) {
  if (isDeepWorkActive) {
    return { deferred: true, queuedAt: Date.now(), message };
  }
  return { deferred: false, deliveredAt: Date.now(), message };
}</code></pre>
    `,
  },
  {
    slug: "tactile-typography-modern-os",
    title: "Tactile Typography in Modern Operating Systems",
    subtitle:
      "Exploring physical typesetting traditions to revitalize the clinical sterility of contemporary desktop typography and high-density displays.",
    excerpt:
      "Exploring physical typesetting traditions to revitalize the clinical sterility of contemporary desktop typography and high-density displays.",
    category: "Technology" as const,
    tags: ["TYPOGRAPHY & SYSTEMS"],
    readTime: "5 min read",
    wordCount: 280,
    status: "published" as const,
    subscriptionMode: "free" as const,
    price: {
      amount: 0,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Traditional movable metal letterpress type blocks arranged on a wooden workbench",
      caption: "Foundry matrices and optical size specimens — Archival Plate IV, 2026",
      fileName: "letterpress_matrices_plate.webp",
      fileSize: 1750400,
      dimensions: "2400 × 1350",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-08-19T10:00:00Z"),
    previewContentHtml: `
      <p class="drop-cap">When punchcutters in the sixteenth century carved steel matrices by hand, they did not merely scale a single vector outline linearly from <code>8pt</code> to <code>48pt</code>.</p>
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
      <pre><code>.editorial-prose {
  font-optical-sizing: auto;
  line-height: 1.75;
  max-inline-size: 65ch;
  text-rendering: optimizeLegibility;
}</code></pre>
    `,
  },
  {
    slug: "distributed-topology-outlast-frenzy",
    title: "Distributed Topology: Engineering Built to Outlast Frenzy",
    subtitle:
      "Lessons drawn from resilient decentralized infrastructure operating across bandwidth-constrained networks in East Africa.",
    excerpt:
      "Lessons drawn from resilient decentralized infrastructure operating across bandwidth-constrained networks in East Africa.",
    category: "Architecture" as const,
    tags: ["DISTRIBUTED SYSTEMS"],
    readTime: "12 min read",
    wordCount: 340,
    status: "published" as const,
    subscriptionMode: "paid" as const,
    price: {
      amount: 5000,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Illuminated server rack cabling inside a dark data center",
      caption:
        "Regional mesh relay node in Kampala — Photographed by Nii Kotei, 2026",
      fileName: "kampala_mesh_relay.webp",
      fileSize: 2120400,
      dimensions: "2400 × 1350",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-07-04T08:00:00Z"),
    previewContentHtml: `
      <p class="drop-cap">When engineers design distributed systems solely inside gigabit fiber campuses, they unconsciously treat network partitions as <strong>rare anomalies</strong> rather than the default operating state. Across regional corridors in East Africa, intermittent link saturation is a daily physical reality that exposes fragile consensus assumptions within minutes.</p>
      <blockquote>
        <p>“Resilience is measured not when every fiber link is lit, but when three regional relays go dark simultaneously and local nodes continue settling transactions.”</p>
        <cite>— KAMPALA SYSTEMS SYMPOSIUM (2026)</cite>
      </blockquote>
    `,
    fullContentHtml: `
      <p class="drop-cap">When engineers design distributed systems solely inside gigabit fiber campuses, they unconsciously treat network partitions as <strong>rare anomalies</strong> rather than the default operating state. Across regional corridors in East Africa, intermittent link saturation is a daily physical reality that exposes fragile consensus assumptions within minutes.</p>
      <blockquote>
        <p>“Resilience is measured not when every fiber link is lit, but when three regional relays go dark simultaneously and local nodes continue settling transactions.”</p>
        <cite>— KAMPALA SYSTEMS SYMPOSIUM (2026)</cite>
      </blockquote>
      <p>By designing around <u>local-first append-only logs</u> and compact delta synchronization, nodes remain <span style="color: #1e5ae3; font-weight: 500;">autonomous for weeks</span> without upstream coordination.</p>
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
    slug: "anatomy-of-resilient-distributed-systems",
    title: "The Anatomy of Resilient Distributed Systems",
    subtitle:
      "Why modern hyper-scaled topologies frequently collapse under synchronous cascading locks, and how adopting asynchronous partition boundaries creates calm.",
    excerpt:
      "Why modern hyper-scaled topologies frequently collapse under synchronous cascading locks, and how adopting asynchronous partition boundaries creates calm.",
    category: "Architecture" as const,
    tags: ["SYSTEMS ARCHITECTURE"],
    readTime: "10 min read",
    wordCount: 290,
    status: "published" as const,
    subscriptionMode: "free" as const,
    price: {
      amount: 0,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Sunlit brutalist concrete interior with timber ceiling beams and staircase",
      caption:
        "Structural load-isolation study — Architectural Monograph Series, 2026",
      fileName: "load_isolation_study.webp",
      fileSize: 1840200,
      dimensions: "2400 × 1350",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-06-22T10:00:00Z"),
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
      </ul>
    `,
  },
  {
    slug: "memory-allocations-bare-metal",
    title: "Memory Allocations in Bare-Metal Embedded Runtimes",
    subtitle:
      "Deterministic arena allocators, zero-copy ring buffers, and the craft of writing predictable systems software that runs for decades without rebooting.",
    excerpt:
      "Deterministic arena allocators, zero-copy ring buffers, and the craft of writing predictable systems software that runs for decades without rebooting.",
    category: "Technology" as const,
    tags: ["SYSTEMS & CRAFT", "EMBEDDED"],
    readTime: "9 min read",
    wordCount: 248,
    status: "draft" as const,
    subscriptionMode: "paid" as const,
    price: {
      amount: 8000,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Macro photograph of precision circuit board traces and microcontrollers",
      caption:
        "Embedded telemetry controller board — Hardware Verification Lab, 2026",
      fileName: "kampala_telecom_infrastructure_archival.webp",
      fileSize: 2516582,
      dimensions: "2560 × 1440",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-05-30T10:00:00Z"),
    previewContentHtml: `
      <p class="drop-cap">In safety-critical and long-lived embedded systems, general-purpose heap allocation (<code>malloc</code> / <code>free</code>) after initialization is treated as a <strong>latent defect</strong>. Over months of continuous operation, variable-sized allocations fragment physical RAM until a routine request fails unpredictably.</p>
      <blockquote>
        <p>“If you know the upper bound of your workload at compile time, pre-allocate the arena once at boot and never ask the allocator again.”</p>
        <cite>— BARE-METAL SYSTEMS MANUAL (2026)</cite>
      </blockquote>
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
  {
    slug: "civic-distributed-ledgers-archival",
    title: "Civic Distributed Ledgers: Archival Protocols",
    subtitle:
      "Immutable public registries designed for municipal land records and offline regional verification.",
    excerpt:
      "Immutable public registries designed for municipal land records and offline regional verification.",
    category: "Architecture" as const,
    tags: ["INFRASTRUCTURE", "ARCHIVAL"],
    readTime: "11 min read",
    wordCount: 360,
    status: "archived" as const,
    subscriptionMode: "paid" as const,
    price: {
      amount: 5000,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Clean geometric facade of a modern architectural structure",
      caption: "Municipal ledger archive study — Kampala, 2026",
      fileName: "civic_distributed_ledgers.webp",
      fileSize: 1920000,
      dimensions: "2400 × 1350",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-05-18T10:00:00Z"),
    previewContentHtml: `
      <p class="drop-cap">Civic registries outlast administrations only when their storage format is <strong>cryptographically self-verifying</strong> and free of vendor lock-in.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">Civic registries outlast administrations only when their storage format is <strong>cryptographically self-verifying</strong> and free of vendor lock-in.</p>
    `,
  },
  {
    slug: "thermal-budgeting-compact-runtimes",
    title: "Thermal Budgeting in Compact Runtimes",
    subtitle:
      "Passive cooling envelopes and instruction-level power scheduling for fanless field servers in equatorial climates.",
    excerpt:
      "Passive cooling envelopes and instruction-level power scheduling for fanless field servers in equatorial climates.",
    category: "Technology" as const,
    tags: ["COMPUTING", "HARDWARE"],
    readTime: "7 min read",
    wordCount: 230,
    status: "draft" as const,
    subscriptionMode: "free" as const,
    price: {
      amount: 0,
      currency: "UGX",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",
    coverImageData: {
      alt: "Passive heatsink fins on a compact field server",
      caption: "Equatorial thermal test bench — Field Report, 2026",
      fileName: "thermal_budgeting_compact.webp",
      fileSize: 1640000,
      dimensions: "2400 × 1350",
    },
    author: DEFAULT_AUTHOR,
    updatedAt: Date.parse("2026-05-11T10:00:00Z"),
    previewContentHtml: `
      <p class="drop-cap">Moving air with mechanical fans introduces dust ingress and bearing failure into remote telecom huts. <strong>Passive thermal budgeting</strong> treats heat dissipation as a first-class scheduler constraint.</p>
    `,
    fullContentHtml: `
      <p class="drop-cap">Moving air with mechanical fans introduces dust ingress and bearing failure into remote telecom huts. <strong>Passive thermal budgeting</strong> treats heat dissipation as a first-class scheduler constraint.</p>
    `,
  },
];

export const seedMockBlogsInternal = internalMutation({
  args: {},
  returns: v.object({
    insertedCount: v.number(),
    replacedCount: v.number(),
  }),
  handler: async (ctx) => {
    let insertedCount = 0;
    let replacedCount = 0;

    for (const item of INITIAL_SEED_BLOGS) {
      const existing = await ctx.db
        .query("blogs")
        .withIndex("by_slug", (q) => q.eq("slug", item.slug))
        .unique();

      if (existing) {
        await ctx.db.replace(existing._id, item);
        replacedCount += 1;
      } else {
        await ctx.db.insert("blogs", item);
        insertedCount += 1;
      }
    }

    return { insertedCount, replacedCount };
  },
});

export const ensureSeeded = mutation({
  args: {},
  returns: v.object({
    seeded: v.boolean(),
    insertedCount: v.number(),
  }),
  handler: async (ctx) => {
    const existingAny = await ctx.db.query("blogs").take(1);
    if (existingAny.length > 0) {
      return { seeded: false, insertedCount: 0 };
    }

    let insertedCount = 0;
    for (const item of INITIAL_SEED_BLOGS) {
      await ctx.db.insert("blogs", item);
      insertedCount += 1;
    }

    return { seeded: true, insertedCount };
  },
});
