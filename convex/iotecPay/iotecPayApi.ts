import type { Collection, ErrorResponse } from "./iotecPayTypes"
import {getToken} from "./iotecPayToken"
import { env } from "../_generated/server"

function baseUrl(): string {
    const url = env.IOTEC_PAY_BASE_URL
    if (!url) throw new Error("IOTEC_PAY_BASE_URL is not configured")
    return url.replace(/\/$/, "")
}

export const makeCollection = async (walletId: string, transactionId: string, payer: string, amount: number, currency: string, memo?: string): Promise<{ id: string } | ErrorResponse> => {
    const token = await getToken()

    console.log("token", token)
    const request = {
        category: 'MobileMoney',
        walletId: walletId,
        externalId: transactionId,
        payer: payer,
        payerNote: memo,
        amount: amount,
        currency: currency,
    }

    const response = await fetch(`${baseUrl()}/collections/collect`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    })

    const responseData: unknown = await response.json().catch(() => null)
    const data = responseData && typeof responseData === "object" ? responseData : null
    const providerMessage = data && "message" in data && typeof data.message === "string"
        ? data.message.slice(0, 300)
        : null

    if (!response.ok) {
        const message = providerMessage
            ? `iotecPay rejected the payment (HTTP ${response.status}): ${providerMessage}`
            : `iotecPay rejected the payment (HTTP ${response.status}).`
        // Server failures, rate limits, and duplicate references may have reached the
        // provider; leave those attempts pending for status verification.
        if (response.status >= 500 || response.status === 429 || response.status === 409) {
            throw new Error(message)
        }
        return { code: `HTTP_${response.status}`, message }
    }
    if (data && "code" in data && "message" in data &&
        typeof data.code === "string" && providerMessage) {
        return { code: data.code, message: providerMessage }
    }
    if (!data || !("id" in data) || typeof data.id !== "string") {
        throw new Error("iotecPay returned a collection response without an ID.")
    }
    return { id: data.id }
}

export const getCollectionStatusByTransactionId = async (transactionId: string): Promise<Collection> => {
    const token = await getToken()

    const response = await fetch(`${baseUrl()}/collections/external-id/${encodeURIComponent(transactionId)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to check collection status (${response.status})`);
    }
    const data: unknown = await response.json()
    if (!data || typeof data !== "object" || !("externalId" in data) ||
        !("status" in data) || !("amount" in data) || !("currency" in data) ||
        (!("walletId" in data) && !("wallet" in data))) {
        throw new Error("Invalid collection status response")
    }
    return data as Collection
}
