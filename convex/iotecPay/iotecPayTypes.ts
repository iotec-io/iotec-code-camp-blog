export type CollectionChargeViewModel = {
    amount?: number;
    vendorCharge?: number;
    transactionCharge?: number;
    totalTransactionCharge?: number;
}

export type CollectionPreview = {
    vendor?: string | null;
    payer?: string | null;
    payerName?: string | null;
    amount?: number;
    chargeModel?: string | null;
    transactionCharge?: number;
    vendorCharge?: number;
    totalTransactionCharge?: number;
    customerBill?: number;
    extendedCharges?: CollectionChargeViewModel;
}

export type ErrorResponse = {
    code: string;
    message: string;
}

export type Collection = {
    id: string;
    createdAt: string;
    category?: string | null;
    status?: string | null;
    paymentChannel?: string | null;
    statusCode?: string | null;
    statusMessage?: string | null;
    externalId?: string | null;
    amount?: number;
    payerNote?: string | null;
    payeeNote?: string | null;
    currency?: string | null;
    walletId?: string | null;
    wallet?: {
        id?: string | null;
        name?: string | null;
    };
    chargeModel?: string | null;
    createdBy?: string | null;
    transactionCharge?: number;
    vendorCharge?: number;
    totalTransactionCharge?: number;
    vendor?: string | null;
    vendorTransactionId?: string | null;
    reconciledOn?: string | null;
    transactions?: any[] | null;
    payer?: string | null;
    payerName?: string | null;
    lastUpdated?: string | null;
    processedAt?: string | null;
}
