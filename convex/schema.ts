import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const blogCategoryValidator = v.union(
  v.literal("Architecture"),
  v.literal("Technology"),
);

export const blogStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

export const subscriptionModeValidator = v.union(
  v.literal("free"),
  v.literal("paid"),
);

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),

  blogs: defineTable({
    slug: v.string(),
    title: v.string(),
    subtitle: v.string(),
    excerpt: v.string(),
    previewContentHtml: v.string(),
    fullContentHtml: v.string(),
    category: blogCategoryValidator,
    tags: v.optional(v.array(v.string())),
    readTime: v.string(),
    wordCount: v.number(),
    status: blogStatusValidator,
    subscriptionMode: subscriptionModeValidator,
    price: v.object({
      amount: v.number(),
      currency: v.string(),
    }),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    coverImageData: v.object({
      alt: v.string(),
      caption: v.string(),
      fileName: v.optional(v.string()),
      fileSize: v.optional(v.number()),
      dimensions: v.optional(v.string()),
    }),
    author: v.optional(
        v.object({
          id: v.string(),
          name: v.string(),
          role: v.string()
        })
    ),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_status_and_category", ["status", "category"]),
});
