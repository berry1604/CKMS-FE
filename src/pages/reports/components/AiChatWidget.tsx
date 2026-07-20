import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, HelpCircle, User as UserIcon } from 'lucide-react';
import { aiReportApi } from '../../../services/aiReport.api';
import type { AiChatMessage } from '../../../types/aiReport';
import toast from 'react-hot-toast';

interface AiChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

const QUICK_SUGGESTIONS = [
    "Cửa hàng nào đang nợ công nợ cao nhất và quá hạn?",
    "Tỷ lệ giao hàng hoàn tất trên chuỗi hiện tại là bao nhiêu %?",
    "Hôm nay có đơn hàng đặt nào bị ngâm duyệt quá 4 tiếng không?",
    "Tình hình sản xuất tại bếp trung tâm đạt tiến độ ra sao?"
];

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<AiChatMessage[]>([
        {
            id: 'init-1',
            role: 'assistant',
            content: 'Xin chào! Tôi là Trợ lý AI Điều hành CKMS (Powered by qwen2.5:3b). Bạn cần tra cứu thông tin gì về 8 nhóm số liệu doanh thu, công nợ hay vận hành hôm nay?',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputQuery, setInputQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (queryText?: string) => {
        const questionText = queryText || inputQuery;
        if (!questionText.trim() || isThinking) return;

        const userMsg: AiChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: questionText.trim(),
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        if (!queryText) setInputQuery('');
        setIsThinking(true);

        try {
            // Build chat history string
            const chatHistory = messages
                .slice(-6)
                .map(m => `${m.role === 'user' ? 'Quản lý' : 'AI'}: ${m.content}`)
                .join('\n');

            const res = await aiReportApi.chatWithExecutiveData({
                question: questionText.trim(),
                chatHistory
            });

            const assistantMsg: AiChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: res.answer || 'Xin lỗi, tôi không thể xử lý câu hỏi lúc này.',
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Trợ lý AI đang phản hồi chậm.');
            const errorMsg: AiChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: '⚠️ Kết nối tới dịch vụ AI Ollama gặp gián đoạn hoặc hết thời gian chờ. Bạn vui lòng thử lại sau giây lát.',
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-lg h-[620px] flex flex-col bg-[#0F172A] border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-950/80 via-slate-900 to-slate-900 border-b border-violet-500/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Bot className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Trợ Lý AI Hỏi Đáp Điều Hành
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full">
                                LIVE
                            </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Truy xuất số liệu 8 nhóm CKMS theo thời gian thực
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Quick suggestions */}
            <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <HelpCircle className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">Gợi ý:</span>
                <div className="flex items-center gap-1.5">
                    {QUICK_SUGGESTIONS.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isThinking}
                            className="text-[11px] bg-slate-800/80 hover:bg-violet-900/40 text-slate-300 hover:text-violet-200 px-3 py-1 rounded-full border border-slate-700/60 hover:border-violet-500/40 whitespace-nowrap transition-all"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/40">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white'
                                    : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
                            }`}
                        >
                            {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div
                            className={`max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 text-amber-100 rounded-tr-none'
                                    : 'bg-slate-900/90 border border-violet-500/20 text-slate-200 rounded-tl-none shadow-lg'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <span
                                className={`block text-[10px] mt-2 ${
                                    msg.role === 'user' ? 'text-amber-300/60 text-right' : 'text-slate-500'
                                }`}
                            >
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}

                {isThinking && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                            <Bot className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="bg-slate-900/90 border border-violet-500/20 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                            <span className="text-xs text-violet-300 animate-pulse">
                                AI đang tra cứu & suy luận từ ma trận dữ liệu 8 nhóm...
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        placeholder="Hỏi AI về công nợ, doanh thu, vận chuyển..."
                        disabled={isThinking}
                        className="flex-1 bg-slate-950/80 border border-slate-700/80 focus:border-violet-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!inputQuery.trim() || isThinking}
                        className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center shadow-lg shadow-violet-500/20 transition-all"
                    >
                        {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
};
