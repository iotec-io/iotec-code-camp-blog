import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: {
    IOTEC_PAY_BASE_URL: v.optional(v.string()),
    IOTEC_PAY_WALLET_ID: v.optional(v.string()),
    IOTEC_PAY_CURRENCY: v.optional(
      v.union(v.literal("ITX"), v.literal("UGX")),
    ),
    IOTEC_AUTH_ISSUER: v.optional(v.string()),
    IOTEC_AUTH_CLIENT_ID: v.optional(v.string()),
    IOTEC_AUTH_CLIENT_SECRET: v.optional(v.string()),
  },
});
