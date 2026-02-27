import axiosClient from './axiosClient';
import type {
    BatchBillingStatementRequest,
    BillingStatementResponse,
    BatchBillingStatementResponse,
    ApiResponse
} from '../types/billing';

export const billingApi = {
    /**
     * Generate manual billing statement
     * Security: hasAnyRole('ADMIN', 'SYSTEM')
     */
    generateManualStatement: async (storeId: number, periodStart: string, periodEnd: string): Promise<ApiResponse<BillingStatementResponse>> => {
        try {
            const response = await axiosClient.post<ApiResponse<BillingStatementResponse>>(
                '/billing-statements/generate',
                null, // No body
                {
                    params: { storeId, periodStart, periodEnd }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error generating manual billing statement:', error);
            throw error;
        }
    },

    /**
     * Generate batch billing statements
     * Security: hasRole('SYSTEM')
     */
    generateBatchStatements: async (request: BatchBillingStatementRequest): Promise<ApiResponse<BatchBillingStatementResponse>> => {
        try {
            const response = await axiosClient.post<ApiResponse<BatchBillingStatementResponse>>(
                '/billing-statements/generate/batch',
                request
            );
            return response.data;
        } catch (error) {
            console.error('Error generating batch billing statements:', error);
            throw error;
        }
    }
};
