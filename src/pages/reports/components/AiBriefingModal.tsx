import React, { useState, useEffect } from 'react';
import {
    Sparkles, X, RefreshCw, CheckCircle2, AlertTriangle,
    Target, Bot, Zap
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { aiReportApi } from '../../../services/aiReport.api';
import type { AiAnalysisResponse } from '../../../types/aiReport';
import toast from 'react-hot-toast';

interface AiBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenChat?: () => void;
}

export const AiBriefingModal: React.FC<AiBriefingModalProps> = ({
    isOpen,
    onClose,
    onOpenChat
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AiAnalysisResponse | null>(null);

    const fetchAnalysis = async () => {
        setIsLoading(true);
        try {
            const data = await aiReportApi.analyzeExecutiveCockpit();
            setAnalysis(data);
            toast.success('Đã hoàn tất chuẩn đoán AI điều hành!');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể gọi AI phân tích lúc này.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !analysis && !isLoading) {
            fetchAnalysis();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0F172A] border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-violet-950/60 via-slate-900/80 to-slate-900 border-b border-violet-500/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Bot className="w-6 h-6 text-white animate-bounce" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white tracking-wide">
                                    AI Executive Cockpit Briefing
                                </h2>
                                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> QWEN 2.5 : 3B
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Tổng hợp & Phân tích đa chiều 8 Nhóm số liệu thời gian thực
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={fetchAnalysis}
                            disabled={isLoading}
                            className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs px-3 py-2 flex items-center gap-2"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-violet-400' : ''}`} />
                            Phân tích lại
                        </Button>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="w-8 h-8 text-violet-400 animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2 max-w-md">
                                <h3 className="text-base font-bold text-white tracking-wide animate-pulse">
                                    AI Đang Quét 8 Nhóm Chỉ Số Chuỗi CKMS...
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Đang phân tích dòng tiền Thực thu, Top 5 cửa hàng nợ xấu, hiệu suất giao xe AhMove và tiến độ sản xuất tại Bếp Trung Tâm.
                                </p>
                            </div>
                        </div>
                    ) : analysis ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Section 1: Highlights */}
                            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-emerald-300 uppercase tracking-wider">
                                        🟢 Điểm Sáng Vận Hành (Highlights)
                                    </h3>
                                </div>
                                <ul className="space-y-3 pl-2">
                                    {analysis.highlights && analysis.highlights.length > 0 ? (
                                        analysis.highlights.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-emerald-100/90 leading-relaxed">
                                                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-sm text-slate-400 italic pl-4">Khởi sắc ổn định trên toàn chuỗi.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Section 2: Risks */}
                            <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-rose-500/50 transition-all">
                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-rose-300 uppercase tracking-wider">
                                        🔴 Rủi Ro & Điểm Nghẽn Khẩn Cấp (Critical Risks)
                                    </h3>
                                </div>
                                <ul className="space-y-3 pl-2">
                                    {analysis.risks && analysis.risks.length > 0 ? (
                                        analysis.risks.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-rose-100/90 leading-relaxed">
                                                <span className="text-rose-400 font-bold mt-0.5">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-sm text-slate-400 italic pl-4">Hệ thống an toàn tuyệt đối, không ghi nhận rủi ro khẩn cấp.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Section 3: Recommendations */}
                            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-indigo-300 uppercase tracking-wider">
                                        🎯 Khuyến Nghị Hành Động (Actionable Recommendations)
                                    </h3>
                                </div>
                                <ul className="space-y-3 pl-2">
                                    {analysis.recommendations && analysis.recommendations.length > 0 ? (
                                        analysis.recommendations.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-indigo-100/90 leading-relaxed">
                                                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-sm text-slate-400 italic pl-4">Duy trì kế hoạch giám sát hiện tại.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            Chưa có dữ liệu chuẩn đoán từ mô hình AI.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-8 py-5 bg-slate-900/90 border-t border-slate-800">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        ⚡ Dữ liệu phân tích thời gian thực từ 8 Nhóm CKMS
                    </span>
                    <div className="flex items-center gap-3">
                        {onOpenChat && (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    onClose();
                                    onOpenChat();
                                }}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" /> Hỏi Đáp AI Ngay
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-5 py-2.5 rounded-xl"
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
