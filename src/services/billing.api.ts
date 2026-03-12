import axiosClient from "./axiosClient";
import type {
  BatchBillingStatementRequest,
  BillingStatementResponse,
  BatchBillingStatementResponse,
  BillingStatementSummaryResponse,
  BillingStatementDetailResponse,
  PaymentStatementRequest,
  PaymentStatementResponse,
  ApiResponse,
} from "../types/billing";

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const billingApi = {
  /**
   * Generate manual billing statement for a specific store
   * POST /billing-statements/generate?storeId=&periodStart=&periodEnd=
   * Security: hasAuthority('CONFIRM_PAYMENT')
   */
  generateManualStatement: async (
    storeId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<BillingStatementResponse> => {
    const response = await axiosClient.post<
      ApiResponse<BillingStatementResponse>
    >("/billing-statements/generate", null, {
      params: { storeId, periodStart, periodEnd },
    });
    return response.data.data;
  },

  /**
   * Generate batch billing statements for all stores
   * POST /billing-statements/generate/batch
   * Security: hasAuthority('CONFIRM_PAYMENT')
   */
  generateBatchStatements: async (
    request: BatchBillingStatementRequest,
  ): Promise<BatchBillingStatementResponse> => {
    const response = await axiosClient.post<
      ApiResponse<BatchBillingStatementResponse>
    >("/billing-statements/generate/batch", request);
    return response.data.data;
  },

  /**
   * Get all billing statements (paged)
   * GET /billing-statements?storeId=&status=&page=&size=&sort=
   * Security: hasAuthority('VIEW_BILLING')
   */
  getStatements: async (params?: {
    storeId?: number;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<BillingStatementSummaryResponse>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<BillingStatementSummaryResponse>>
    >("/billing-statements", { params });
    return response.data.data;
  },

  /**
   * Get billing statement detail by ID
   * GET /billing-statements/:id
   * Security: hasAuthority('VIEW_BILLING')
   */
  getStatementDetail: async (
    id: number,
  ): Promise<BillingStatementDetailResponse> => {
    const response = await axiosClient.get<
      ApiResponse<BillingStatementDetailResponse>
    >(`/billing-statements/${id}`);
    return response.data.data;
  },

  /**
   * Pay a billing statement
   * PATCH /billing-statements/:id/pay
   * Security: hasAuthority('CONFIRM_PAYMENT')
   */
  payStatement: async (
    id: number,
    request: PaymentStatementRequest,
  ): Promise<PaymentStatementResponse> => {
    const response = await axiosClient.patch<
      ApiResponse<PaymentStatementResponse>
    >(`/billing-statements/${id}/pay`, request);
    return response.data.data;
  },

  /**
   * Delete a billing statement
   * DELETE /billing-statements/:id
   * Security: hasAuthority('CONFIRM_PAYMENT') or equivalent
   */
  deleteStatement: async (id: number): Promise<void> => {
    await axiosClient.delete(`/billing-statements/${id}`);
  },

  /**
   * Create VNPay payment URL for a billing statement
   * POST /billing-statements/:id/vnpay
   * Security: hasAuthority('CONFIRM_PAYMENT')
   * Returns: payment URL string to redirect user to VNPay
   */
  createVNPayUrl: async (id: number): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>(
      `/billing-statements/${id}/vnpay`
    );
    return response.data.data;
  },
};
