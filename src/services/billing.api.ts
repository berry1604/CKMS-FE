import axiosClient from "./axiosClient";
import type {
  BatchBillingStatementRequest,
  BillingStatementResponse,
  BatchBillingStatementResponse,
  BillingStatementSummaryResponse,
  BillingStatementDetailResponse,
  PaymentStatementRequest,
  PaymentStatementResponse,
} from "../types/billing";

// Định nghĩa cấu trúc chuẩn của Backend
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

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

const BASE_URL = "/billing-statements";

export const billingApi = {
  /**
   * GET /api/v1/billing-statements
   */
  getStatements: async (params: {
    storeId?: number;
    status?: string;
    page: number;
    size: number;
  }): Promise<PageResponse<BillingStatementSummaryResponse>> => {
    const res = await axiosClient.get<ApiResponse<PageResponse<BillingStatementSummaryResponse>>>(BASE_URL, { params });
    return res.data.data;
  },

  /**
   * GET /api/v1/billing-statements/{id}
   */
  getStatementDetail: async (id: number): Promise<BillingStatementDetailResponse> => {
    const res = await axiosClient.get<ApiResponse<BillingStatementDetailResponse>>(`${BASE_URL}/${id}`);
    return res.data.data;
  },

  /**
   * POST /api/v1/billing-statements/{id}/vnpay
   */
  createVnPayUrl: async (id: number): Promise<string> => {
    const res = await axiosClient.post<ApiResponse<string>>(`${BASE_URL}/${id}/vnpay`);
    return res.data.data;
  },

  /**
   * GET /api/v1/billing-statements/vnpay-return
   */
  verifyVnPayReturn: async (params: any): Promise<any> => {
    const res = await axiosClient.get<ApiResponse<any>>(`${BASE_URL}/vnpay-return`, { params });
    return res.data.data;
  },

  /**
   * POST /api/v1/billing-statements/generate
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
   * POST /api/v1/billing-statements/generate/batch
   */
  generateBatchStatements: async (
    request: BatchBillingStatementRequest,
  ): Promise<BatchBillingStatementResponse> => {
    const res = await axiosClient.post<ApiResponse<BatchBillingStatementResponse>>(
      `${BASE_URL}/generate/batch`, 
      request
    );
    return res.data.data;
  },

  /**
   * PATCH /api/v1/billing-statements/{id}/pay
   */
  payStatement: async (
    id: number,
    request: PaymentStatementRequest,
  ): Promise<PaymentStatementResponse> => {
    const res = await axiosClient.patch<ApiResponse<PaymentStatementResponse>>(
      `${BASE_URL}/${id}/pay`,
      request
    );
    return res.data.data;
  },

  /**
   * DELETE /api/v1/billing-statements/{id}
   */
  deleteStatement: async (id: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${id}`);
  },
};