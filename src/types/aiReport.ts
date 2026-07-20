export interface AiAnalysisResponse {
    highlights: string[];
    risks: string[];
    recommendations: string[];
    rawAnalysis: string;
}

export interface AiChatRequest {
    question: string;
    chatHistory?: string;
}

export interface AiChatResponse {
    answer: string;
    modelUsed: string;
}

export interface AiChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
