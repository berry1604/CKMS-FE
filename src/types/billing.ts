export interface BatchBillingStatementRequest {
    periodStart: string; // ISO Date string YYYY-MM-DD
    periodEnd: string;   // ISO Date string YYYY-MM-DD
    cycleName: string;
}

export interface BillingStatementResponse {
    statementId: number;
    storeId: number;
    cycleName: string;
    periodStart: string;
    periodEnd: string;
    totalAmount: number;
    status: string;
    invoiceCount: number;
}

export interface BatchBillingStatementResponse {
    message?: string;
    // Fields can be expanded later
}

export interface BillingStatementSummaryResponse {
    statementId: number;
    cycleName: string;
    totalAmount: number;
    status: string;
    issuedAt: string;
}

export interface StoreSimpleResponse {
    id: number;
    name: string;
}

export interface InvoiceDetailResponse {
    invoiceId?: number;
    amount?: number;
}

export interface BillingStatementDetailResponse {
    statementId: number;
    store: StoreSimpleResponse;
    periodStart: string;
    periodEnd: string;
    totalAmount: number;
    status: string;
    paidAt: string | null;
    invoices: InvoiceDetailResponse[];
}

export interface PaymentStatementRequest {
    paymentMethod?: string;
    referenceCode?: string;
    amount?: number;
}

export interface PaymentStatementResponse {
    statementId: number;
    status: string;
    paidAt: string;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}
