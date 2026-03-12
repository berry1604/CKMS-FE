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

const BASE_URL = "/api/v1/billing-statements";

export const billingApi = {
  /**
   * Generate manual billing statement for a specific store
   */
  generateManualStatement: async (
    storeId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<BillingStatementResponse> => {
    const res = await axiosClient.post<ApiResponse<BillingStatementResponse>>(
      `${BASE_URL}/generate`,
      null,
      { params: { storeId, periodStart, periodEnd } },
    );
    return res.data.data;
  },

  /**
   * Generate batch billing statements for all stores
   */
  generateBatchStatements: async (
    request: BatchBillingStatementRequest,
  ): Promise<BatchBillingStatementResponse> => {
    const res = await axiosClient.post<ApiResponse<BatchBillingStatementResponse>>(
      `${BASE_URL}/generate/batch`,
      request,
    );
    return res.data.data;
  },

  /**
   * Get all billing statements (paged)
   */
  getStatements: async (params?: {
    storeId?: number;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<BillingStatementSummaryResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<PageResponse<BillingStatementSummaryResponse>>
    >(BASE_URL, { params });
    return res.data.data;
  },

  /**
   * Get billing statement detail by ID
   */
  getStatementDetail: async (
    id: number,
  ): Promise<BillingStatementDetailResponse> => {
    const res = await axiosClient.get<ApiResponse<BillingStatementDetailResponse>>(
      `${BASE_URL}/${id}`,
    );
    return res.data.data;
  },

  /**
   * Pay a billing statement
   */
  payStatement: async (
    id: number,
    request: PaymentStatementRequest,
  ): Promise<PaymentStatementResponse> => {
    const res = await axiosClient.patch<ApiResponse<PaymentStatementResponse>>(
      `${BASE_URL}/${id}/pay`,
      request,
    );
    return res.data.data;
  },

  /**
   * Delete a billing statement
   */
  deleteStatement: async (id: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${id}`);
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
