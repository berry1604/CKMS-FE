export interface BatchBillingStatementRequest {
  periodStart: string; // ISO Date string YYYY-MM-DD
  periodEnd: string; // ISO Date string YYYY-MM-DD
  cycleName: string;
}

export interface BillingStatementResponse {
  statementId: number;
  storeId: number;
  storeName?: string;
  cycleName: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: string;
  invoiceCount: number;
  issuedAt?: string;
}

export interface BatchBillingStatementResponse {
  totalStores: number;
  successCount: number;
  failureCount: number;
  statements: BillingStatementResponse[];
  errors?: string[];
}

export interface BillingStatementSummaryResponse {
  statementId: number;
  storeName?: string;
  storeId?: number;
  cycleName: string;
  totalAmount: number;
  status: string;
  issuedAt: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface StoreSimpleResponse {
  id: number;
  name: string;
}

export interface InvoiceDetailResponse {
  invoiceId: number;
  orderId?: number;
  orderDate?: string;
  amount: number;
  status?: string;
  note?: string;
}

export interface BillingStatementDetailResponse {
  statementId: number;
  store: StoreSimpleResponse;
  cycleName?: string;
  periodStart: string;
  periodEnd: string;
  orderTotal?: number;
  shippingTotal?: number;
  totalAmount: number;
  status: string;
  issuedAt?: string;
  paidAt: string | null;
  paymentMethodId?: number;
  paymentMethodName?: string;
  transactionReference?: string;
  note?: string;
  invoices: InvoiceDetailResponse[];
}

export interface PaymentStatementRequest {
  paymentMethodId: number;
  transactionReference?: string;
  note?: string;
}

export interface PaymentStatementResponse {
  statementId: number;
  status: string;
  paidAt: string;
  transactionReference?: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}
