export interface BatchBillingStatementRequest {
    periodStart: string; // ISO Date string YYYY-MM-DD
    periodEnd: string;   // ISO Date string YYYY-MM-DD
    cycleName: string;
}

export interface BillingStatementResponse {
    statementId: number;
    storeId: number;
    cycleStart: string;
    cycleEnd: string;
    totalAmount: number;
    status: string; // Enum: PENDING, PAID, OVERDUE, etc.
    paidAt?: string;
    paymentMethodId?: number;
}

export interface BatchBillingStatementResponse {
    message?: string;
    // You can expand this based on the actual BE response.
    // Commonly it might contain generated statements or a summary
    statementsGenerated?: number;
    statements?: BillingStatementResponse[];
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}
