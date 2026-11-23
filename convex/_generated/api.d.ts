/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as blogs from "../blogs.js";
import type * as iotecPay_iotecPayActions from "../iotecPay/iotecPayActions.js";
import type * as iotecPay_iotecPayApi from "../iotecPay/iotecPayApi.js";
import type * as iotecPay_iotecPayToken from "../iotecPay/iotecPayToken.js";
import type * as iotecPay_iotecPayTypes from "../iotecPay/iotecPayTypes.js";
import type * as iotecPay_tokenCache from "../iotecPay/tokenCache.js";
import type * as tasks from "../tasks.js";
import type * as transactions from "../transactions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  blogs: typeof blogs;
  "iotecPay/iotecPayActions": typeof iotecPay_iotecPayActions;
  "iotecPay/iotecPayApi": typeof iotecPay_iotecPayApi;
  "iotecPay/iotecPayToken": typeof iotecPay_iotecPayToken;
  "iotecPay/iotecPayTypes": typeof iotecPay_iotecPayTypes;
  "iotecPay/tokenCache": typeof iotecPay_tokenCache;
  tasks: typeof tasks;
  transactions: typeof transactions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
