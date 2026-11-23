import {ConvexError, v} from "convex/values";
import {env, internalMutation, internalQuery} from "./_generated/server";
import {currencyValidator, transactionStatusValidator} from "./schema"

export const create = internalMutation({
    args: {
        blogId: v.id("blogs"),
        email: v.string(),
        phoneNumber: v.string(),
    },
    returns: v.object({
        transactionId: v.id("transactions"),
        status: transactionStatusValidator,
        amount: v.number(),
        currency: currencyValidator,
        payerPhoneNumber: v.string(),
        shouldInitiate: v.boolean()
    }),
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ConvexError("Subscriber's email address is not valid.");
        }

        const currency = env.IOTEC_PAY_CURRENCY;
        if (!currency) {
            throw new ConvexError("Payment currency is not configured.");
        }

        const digits = args.phoneNumber.replace(/\D/g, "");
        const validNumber = currency === "ITX"
            ? /^011177777[0-9]$/.test(digits)
            : /^07[0-9]{8}$/.test(digits);
        if (!validNumber) {
            throw new ConvexError(
                currency === "ITX"
                    ? "Test number is not valid. Expected format (0111777770-9)."
                    : "Subscriber's phone number is not valid. Expected format (0712345678)",
            );
        }

        const blog = await ctx.db.get(args.blogId);
        if (!blog || blog.status !== "published" || blog.subscriptionMode !== "paid") {
            throw new ConvexError("Blog is not available.");
        }

        if (!Number.isFinite(blog.price.amount) || blog.price.amount < 500) {
            throw new ConvexError("Blog does not have a valid price.");
        }

        const payerPhoneNumber = currency === "ITX"
            ? digits
            : `256${digits.slice(1)}`;

        const completed = await ctx.db
            .query("transactions")
            .withIndex("by_blogId_and_payerEmail_and_status_and_transactionType", (q) =>
                q.eq("blogId", args.blogId).eq("payerEmail", email)
                    .eq("status", "completed").eq("transactionType", "subscription"),
            )
            .first();

        const processing = completed ? null : await ctx.db
            .query("transactions")
            .withIndex("by_blogId_and_payerEmail_and_status_and_transactionType", (q) =>
                q.eq("blogId", args.blogId).eq("payerEmail", email)
                    .eq("status", "processing").eq("transactionType", "subscription"),
            )
            .first();

        const pending = completed || processing ? null : await ctx.db
            .query("transactions")
            .withIndex("by_blogId_and_payerEmail_and_status_and_transactionType", (q) =>
                q.eq("blogId", args.blogId).eq("payerEmail", email)
                    .eq("status", "pending").eq("transactionType", "subscription"),
            )
            .first();

        const existingTransaction = completed ?? processing ?? pending;
        if (existingTransaction) {
            return {
                transactionId: existingTransaction._id,
                status: existingTransaction.status,
                amount: existingTransaction.amount,
                currency: existingTransaction.currency,
                payerPhoneNumber: existingTransaction.payerPhoneNumber,
                shouldInitiate: false,
            };
        }

        const transactionId = await ctx.db.insert("transactions", {
            blogId: args.blogId,
            amount: blog.price.amount,
            currency,
            payerEmail: email,
            payerPhoneNumber,
            transactionType: "subscription",
            status: "pending" as const,
        });

        return {
            transactionId,
            status: "pending" as const,
            amount: blog.price.amount,
            currency,
            payerPhoneNumber,
            shouldInitiate: true,
        };
    },
});

export const getById = internalQuery({
    args: {
        id: v.id("transactions")
    },
    returns: v.union(v.null(), v.object({
        amount: v.number(),
        currency: currencyValidator,
        status: transactionStatusValidator,
        statusMessage: v.optional(v.string()),
        externalId: v.optional(v.string()),
    })),
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.id);
        if (!transaction || transaction.transactionType !== "subscription") return null;
        return {
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            statusMessage: transaction.statusMessage,
            externalId: transaction.externalId,
        };
    },
});

export const getBySubscriptionEmail = internalQuery({
    args: {
        email: v.string(),
        blogId: v.id("blogs")
    },
    returns: v.union(v.null(), v.object({
        transactionId: v.id("transactions"),
        status: transactionStatusValidator,
    })),
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ConvexError("Enter a valid email address.");
        }
        const paidTransaction = await ctx.db
            .query("transactions")
            .withIndex("by_blogId_and_payerEmail_and_status_and_transactionType", (q) =>
                q.eq("blogId", args.blogId)
                    .eq("payerEmail", email)
                    .eq("status", "completed")
                    .eq("transactionType", "subscription"),
            )
            .first();
        const pendingTransaction = paidTransaction ? null : await ctx.db
            .query("transactions")
            .withIndex("by_blogId_and_payerEmail_and_status_and_transactionType", (q) =>
                q.eq("blogId", args.blogId)
                    .eq("payerEmail", email)
                    .eq("status", "processing")
                    .eq("transactionType", "subscription"),
            )
            .first();
        const awaitingCollection = paidTransaction ?? pendingTransaction ?? await ctx.db
            .query("transactions")
            .withIndex("by_blogId_and_payerEmail_and_status_and_transactionType", (q) =>
                q.eq("blogId", args.blogId)
                    .eq("payerEmail", email)
                    .eq("status", "pending")
                    .eq("transactionType", "subscription"),
            )
            .first();
        if (!awaitingCollection) return null;
        return {
            transactionId: awaitingCollection._id,
            status: awaitingCollection.status,
        };
    },
});

export const update = internalMutation({
    args: {
        transactionId: v.id("transactions"),
        collectionId: v.optional(v.string()),
        status: v.optional(transactionStatusValidator),
        statusMessage: v.optional(v.string())
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction || transaction.transactionType !== "subscription") {
            throw new ConvexError("Payment attempt not found.");
        }
        if (transaction.status === "completed" || transaction.status === "failed") {
            return null;
        }
        if (transaction.externalId && args.collectionId &&
            transaction.externalId !== args.collectionId) {
            throw new ConvexError("Payment provider returned a different collection ID.");
        }
        await ctx.db.patch(args.transactionId, {
            ...(args.collectionId ? { externalId: args.collectionId } : {}),
            ...(args.status ? { status: args.status } : {}),
            ...(args.statusMessage !== undefined ? { statusMessage: args.statusMessage } : {}),
        });
        return null;
    },
});
