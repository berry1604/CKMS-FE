import axiosClient from "./axiosClient";
import type { AiAnalysisResponse, AiChatRequest, AiChatResponse } from "../types/aiReport";

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}

const BASE_URL = "/ai/reports";

export const aiReportApi = {
    /**
     * POST /api/v1/ai/reports/analyze
     */
    analyzeExecutiveCockpit: async (): Promise<AiAnalysisResponse> => {
        const res = await axiosClient.post<ApiResponse<AiAnalysisResponse>>(`${BASE_URL}/analyze`, null, {
            timeout: 65000, // 65s timeout for AI generation
        });
        return res.data.data;
    },

    /**
     * POST /api/v1/ai/reports/chat
     */
    chatWithExecutiveData: async (request: AiChatRequest): Promise<AiChatResponse> => {
        const res = await axiosClient.post<ApiResponse<AiChatResponse>>(`${BASE_URL}/chat`, request, {
            timeout: 65000,
        });
        return res.data.data;
    },
};
