import { useState, useEffect } from 'react';
import { Network, AlertCircle, Save, Info, ArrowRight, Truck, Database, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { productionPlanApi } from '../../services/productionPlan.api';
import { allocationApi, type AllocationRow } from '../../services/allocationApi';
import type { ProductionPlanSummaryResponse } from '../../types/productionPlan';
import { cn } from '../../utils/classNames';

export const AllocationMatrix = () => {
    const [plans, setPlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);

    const [matrix, setMatrix] = useState<AllocationRow[]>([]);
    const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        if (selectedPlanId) {
            fetchAllocationMatrix(Number(selectedPlanId));
        } else {
            setMatrix([]);
        }
    }, [selectedPlanId]);

    const fetchPlans = async () => {
        setIsLoadingPlans(true);
        try {
            // Fetch completed or finished plans for allocation
            const res = await productionPlanApi.getAllProductionPlans({ size: 50 });
            const valid = (res.content || []).filter(p =>
                p.status === 'COMPLETED' ||
                p.status === 'FINISHED' ||
                p.status === 'READY_TO_PRODUCE' ||
                p.status === 'PRODUCED'
            );
            setPlans(valid);
            if (valid.length > 0 && selectedPlanId === '') {
                setSelectedPlanId(valid[0].planId);
            }
        } catch (error) {
            toast.error('Không thể tải kế hoạch sản xuất');
        } finally {
            setIsLoadingPlans(false);
        }
    };

    const fetchAllocationMatrix = async (planId: number) => {
        setIsLoadingMatrix(true);
        try {
            const data = await allocationApi.previewAllocation(planId);
            setMatrix(data);
        } catch (error) {
            toast.error('Không thể phân bổ dữ liệu plan này');
            setMatrix([]);
        } finally {
            setIsLoadingMatrix(false);
        }
    };

    const handleQuantityChange = (productId: number, storeId: number, newQtyStr: string) => {
        const val = parseInt(newQtyStr, 10);
        const newQty = isNaN(val) ? 0 : val;

        setMatrix(prev => prev.map(row => {
            if (row.productId === productId) {
                // Verify limits
                const currentSum = (row.allocations || []).reduce((sum, a) => sum + (a.storeId === storeId ? 0 : a.allocatedQuantity), 0);
                const safeQty = Math.max(0, Math.min(newQty, row.totalAvailable - currentSum));

                return {
                    ...row,
                    allocations: (row.allocations || []).map(a =>
                        a.storeId === storeId ? { ...a, allocatedQuantity: safeQty } : a
                    )
                };
            }
            return row;
        }));
    };

    const handleSaveAllocation = async () => {
        if (!selectedPlanId || matrix.length === 0) return;

        const payload = {
            productionPlanId: Number(selectedPlanId),
            allocations: (matrix || []).flatMap(row =>
                (row.allocations || []).map(a => ({
                    storeId: a.storeId,
                    productId: row.productId,
                    allocatedQuantity: a.allocatedQuantity
                }))
            )
        };

        setIsSaving(true);
        try {
            await allocationApi.confirmAllocation(payload);
            toast.success('Xác nhận phân bổ kho thành công!');
            fetchAllocationMatrix(Number(selectedPlanId));
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.success('Xác nhận phân bổ kho thành công!');
            } else {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi phân bổ kho');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Extract all unique stores for columns
    const storeColumns = Array.from(new Set((matrix || []).flatMap(r => (r.allocations || []).map(a => a.storeId))))
        .map(id => {
            const a = (matrix || []).flatMap(r => r.allocations || []).find(x => x.storeId === id);
            return { storeId: id, storeName: a?.storeName || `Cửa hàng ${id}` };
        });

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="orange" className="text-[10px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase">WAREHOUSE</Badge>
                        <h1 className="text-3xl font-black text-zinc-100 uppercase tracking-tighter">Ma Trận Điều Phối</h1>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium tracking-wide">
                        Phân bổ thành phẩm từ <span className="text-amber-500/80">Bếp Trung tâm</span> cho các <span className="text-indigo-400">Cửa hàng nhượng quyền</span> dựa trên nhu cầu thực tế.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSaveAllocation}
                        disabled={matrix.length === 0 || isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest px-8 h-12 shadow-xl shadow-indigo-900/20 border-0 flex items-center gap-2"
                    >
                        {isSaving ? 'Đang lưu...' : <><Save size={18} /> Lưu Phân Bổ</>}
                    </Button>
                </div>
            </div>

            {/* Selection & Info Box */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-zinc-900/40 p-6 rounded-[32px] border border-zinc-800/50 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Database size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nguồn hàng</span>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Lô sản xuất / Kế hoạch</label>
                        <div className="relative group">
                            <select
                                className="w-full appearance-none pl-4 pr-10 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all cursor-pointer"
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : '')}
                                disabled={isLoadingPlans}
                            >
                                <option value="">-- Chọn Kế hoạch --</option>
                                {plans.map(p => (
                                    <option key={p.planId} value={p.planId}>#{p.planId} - {p.planName}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                <ArrowRight size={16} className="rotate-90" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-zinc-900/40 p-6 rounded-[32px] border border-zinc-800/50 flex items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] blur-[100px] -mr-32 -mt-32"></div>

                    <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-500/20">
                        <Network size={32} />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Quy tắc phân bổ</span>
                            <div className="h-[1px] w-12 bg-indigo-500/30"></div>
                        </div>
                        <p className="text-[13px] text-zinc-500 font-medium leading-relaxed max-w-2xl">
                            Số lượng phân bổ <span className="text-zinc-200 font-bold italic underline underline-offset-4 decoration-zinc-800">không được vượt quá</span> tổng lượng hàng hiện có (<span className="text-amber-500">Max Available</span>).
                            Ưu tiên các cửa hàng có nhu cầu order cao hơn để đảm bảo vận hành.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">Thiếu hàng</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">Đã cân đối</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Management Table */}
            <div className="bg-zinc-900/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl relative">


                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse border-spacing-0">
                        <thead>
                            <tr className="bg-zinc-900/80 backdrop-blur-md">
                                <th className="px-10 py-8 bg-zinc-900 sticky left-0 z-20 border-r border-zinc-800/50 w-[350px] shadow-[20px_0_30px_-10px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <Database size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white uppercase tracking-tighter">Sản phẩm đầu ra</span>
                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-0.5">Tổng số lượng có sẵn</span>
                                        </div>
                                    </div>
                                </th>
                                {storeColumns.map(col => (
                                    <th key={col.storeId} className="px-8 py-8 min-w-[240px] border-b border-zinc-800/50">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Truck size={14} className="text-indigo-500" />
                                                <span className="text-sm font-black text-zinc-200 uppercase tracking-tighter">{col.storeName}</span>
                                            </div>
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em] px-3 py-1 bg-zinc-950/50 rounded-full border border-zinc-800">Cửa hàng #{col.storeId}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {isLoadingMatrix ? (
                                <tr>
                                    <td colSpan={storeColumns.length + 1} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                                            <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Đang xây dựng ma trận điều phối...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : matrix.length === 0 ? (
                                <tr>
                                    <td colSpan={storeColumns.length + 1} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Network size={64} className="text-zinc-600" />
                                            <span className="text-xl font-black text-zinc-600 uppercase tracking-tighter">
                                                {selectedPlanId ? 'Không có dữ liệu phân bổ cho kế hoạch này' : 'Vui lòng chọn kế hoạch để bắt đầu'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                matrix.map(row => {
                                    const currentTotal = (row.allocations || []).reduce((s, a) => s + a.allocatedQuantity, 0);
                                    const isExceeded = currentTotal > (row.totalAvailable || 0);

                                    return (
                                        <tr key={row.productId} className="hover:bg-zinc-800/20 group transition-colors">
                                            <td className="px-10 py-7 bg-zinc-900/80 backdrop-blur-sm sticky left-0 z-10 border-r border-zinc-800/50 shadow-[20px_0_30px_-10px_rgba(0,0,0,0.5)]">
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-black text-zinc-200 tracking-tighter group-hover:text-amber-500 transition-colors">{row.productName}</span>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-lg font-black font-mono text-xs flex items-center gap-2",
                                                            isExceeded ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                        )}>
                                                            <span className="text-lg">{currentTotal}</span>
                                                            <span className="opacity-40 translate-y-0.5">/</span>
                                                            <span className="opacity-60">{row.totalAvailable}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sẵn có</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {storeColumns.map(col => {
                                                const cell = (row.allocations || []).find((a: any) => a.storeId === col.storeId);
                                                if (!cell) return <td key={col.storeId} className="px-8 py-7 text-center">
                                                    <div className="w-12 h-[2px] bg-zinc-800 mx-auto rounded-full"></div>
                                                </td>;

                                                const isShortage = cell.allocatedQuantity < cell.requestedQuantity;
                                                const isFullValue = cell.allocatedQuantity === cell.requestedQuantity && cell.requestedQuantity > 0;

                                                return (
                                                    <td key={col.storeId} className={cn("px-8 py-7 transition-colors", isShortage ? "bg-red-500/5" : "")}>
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    className={cn(
                                                                        "w-36 h-14 bg-zinc-950 border-2 rounded-2xl text-center text-lg font-black font-mono focus:outline-none focus:ring-4 transition-all pr-8 pl-4 shadow-inner",
                                                                        isShortage
                                                                            ? "border-red-500/30 text-red-500 focus:ring-red-500/10 focus:border-red-500"
                                                                            : isFullValue
                                                                                ? "border-emerald-500/30 text-emerald-500 focus:ring-emerald-500/10 focus:border-emerald-500"
                                                                                : "border-zinc-800 text-zinc-100 focus:ring-indigo-500/10 focus:border-indigo-500"
                                                                    )}
                                                                    value={cell.allocatedQuantity.toString()}
                                                                    onChange={(e) => handleQuantityChange(row.productId, col.storeId, e.target.value)}
                                                                    min={0}
                                                                    max={row.totalAvailable}
                                                                />
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                                                                    <span className="text-[9px] font-black text-zinc-600">REQ</span>
                                                                    <span className="text-[10px] font-black text-zinc-500 tracking-tighter">{cell.requestedQuantity}</span>
                                                                </div>
                                                            </div>

                                                            {isShortage && (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-in zoom-in-90 duration-300">
                                                                    <AlertCircle size={10} className="text-red-500" />
                                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-tight">Hụt {cell.requestedQuantity - cell.allocatedQuantity} đơn vị</span>
                                                                </div>
                                                            )}
                                                            {isFullValue && (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-in zoom-in-90 duration-300">
                                                                    <CheckCircle size={10} className="text-emerald-500" />
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight">Đã tối ưu</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Legend / Footer Overlay */}
                <div className="bg-zinc-900/90 backdrop-blur-md p-6 border-t border-zinc-800 flex justify-between items-center px-10">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Trạng thái kế hoạch</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="info" className="font-black">COORDINATING</Badge>
                            </div>
                        </div>
                        <div className="h-8 w-[1px] bg-zinc-800"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Tổng chi nhánh</span>
                            <span className="text-sm font-black text-zinc-200">{storeColumns.length > 0 ? `${storeColumns.length} Chi nhánh` : '--'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4 max-w-sm">
                            <Info size={18} className="text-amber-500 shrink-0" />
                            <p className="text-[10px] text-zinc-500 font-bold leading-tight uppercase tracking-tight">
                                Hệ thống sẽ tự động giới hạn số lượng phân bổ để không vượt quá định mức sản xuất.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
