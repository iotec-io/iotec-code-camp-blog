import {ConvexError, v} from "convex/values";
import {action, env} from "../_generated/server";
import type {Id} from "../_generated/dataModel";
import {api, internal} from "../_generated/api";
import {getCollectionStatusByTransactionId, makeCollection} from "./iotecPayApi";
import {getToken} from "./iotecPayToken";
import {transactionStatusValidator} from "../schema"

export const initiateCollection = action({
  args: {
    blogId: v.id("blogs"),
    phoneNumber: v.string(),
    email: v.string(),
  },
  returns: v.object({
    transactionId: v.id("transactions"),
    status: transactionStatusValidator,
  }),
  handler: async (ctx, args): Promise<{
    transactionId: Id<"transactions">;
    status: "pending" | "processing" | "completed" | "failed";
  }> => {

    const walletId = env.IOTEC_PAY_WALLET_ID;
    if (!walletId) throw new ConvexError("Payment wallet is not configured.");

    // Reject invalid provider credentials before reserving a pending payment.
    try {
      await getToken();
    } catch (error) {
      console.error("iotecPay authentication failed:", error);
      throw new ConvexError("Payment service authentication is unavailable. Please contact support.");
    }

    try {
      const transaction: {
        transactionId: Id<"transactions">;
        status: "pending" | "processing" | "completed" | "failed";
        amount: number;
        currency: "ITX" | "UGX";
        payerPhoneNumber: string;
        shouldInitiate: boolean;
      } = await ctx.runMutation(internal.transactions.create, {
        blogId: args.blogId,
        phoneNumber: args.phoneNumber,
        email: args.email
      });
      if (!transaction.shouldInitiate) {
        return {transactionId: transaction.transactionId, status: transaction.status};
      }

      const response = await makeCollection(
        walletId,
        transaction.transactionId,
        transaction.payerPhoneNumber,
        transaction.amount,
        transaction.currency,
        `Blog subscription`,
      );

      if ("code" in response) {
        await ctx.runMutation(internal.transactions.update, {
          transactionId: transaction.transactionId,
          status: "failed",
          statusMessage: response.message,
        });
        throw new ConvexError(response.message);
      }

      if (!response.id) throw new Error("Collection response did not include an ID.");

      await ctx.runMutation(internal.transactions.update, {
        transactionId: transaction.transactionId,
        collectionId: response.id,
        status: "processing",
      });

      return {
        transactionId: transaction.transactionId,
        status: "processing",
      };
    } catch (error) {
      // A lost response may still mean the handset was prompted. Keep the attempt
      // available for verification by its unique external transaction ID.
      if (error instanceof ConvexError) throw error;
      const reason = error instanceof Error ? error.message : "Unknown payment provider error";
      console.error("iotecPay collection initiation failed:", reason);
      throw new ConvexError(
        `Payment request could not be confirmed: ${reason} If you approved a prompt, use your email to check the payment before trying again.`,
      );
    }
  },
});

export const checkCollectionStatus = action({
  args: {
    transactionId: v.id("transactions"),
  },
  returns: v.object({
    status: transactionStatusValidator,
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    message?: string;
  }> => {

    const transaction: {
      amount: number;
      currency: "UGX" | "ITX";
      status: "pending" | "processing" | "completed" | "failed";
      statusMessage?: string;
      externalId?: string;
    } | null = await ctx.runQuery(internal.transactions.getById, {id: args.transactionId});

    if (!transaction) throw new ConvexError("Payment attempt not found.");
    if (transaction.status === "completed" || transaction.status === "failed") {
      return {
        status: transaction.status,
        message: transaction.statusMessage
      };
    }

    const collection = await getCollectionStatusByTransactionId(args.transactionId);
    const walletId = env.IOTEC_PAY_WALLET_ID;
    if (
      collection.externalId !== args.transactionId ||
      !collection.id ||
      collection.amount !== transaction.amount ||
      collection.currency !== transaction.currency ||
      (collection.walletId ?? collection.wallet?.id) !== walletId
    ) {
      throw new ConvexError("Payment provider returned mismatched collection details.");
    }
    if (collection.status !== "Success" && collection.status !== "Failed") {
      return { status: "pending" as const };
    }
    const status = collection.status === "Success" ? "completed" : "failed";

    await ctx.runMutation(internal.transactions.update, {
      transactionId: args.transactionId,
      collectionId: collection.id,
      status,
      statusMessage: collection.statusMessage ?? undefined,
    });
    return { status, message: collection.statusMessage ?? undefined };
  },
});

export const restoreAccess = action({
  args: {
    blogId: v.id("blogs"),
    email: v.string(),
  },
  returns: v.union(v.null(), v.id("transactions")),
  handler: async (ctx, args): Promise<Id<"transactions"> | null> => {
    const transaction: {
      transactionId: Id<"transactions">;
      status: "pending" | "processing" | "completed" | "failed";
    } | null = await ctx.runQuery(internal.transactions.getBySubscriptionEmail, args);
    if (!transaction) return null;
    if (transaction.status === "completed") return transaction.transactionId;

    const result: {
      status: "pending" | "processing" | "completed" | "failed";
      message?: string;
    } = await ctx.runAction(api.iotecPay.iotecPayActions.checkCollectionStatus, {
      transactionId: transaction.transactionId,
    });
    return result.status === "completed" ? transaction.transactionId : null;
  },
});
