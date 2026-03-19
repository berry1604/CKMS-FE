import { useState, useEffect } from 'react';
import { Network, AlertCircle, Save, Info, ArrowRight, Truck, Database, CheckCircle, Package, Store, ClipboardList } from 'lucide-react';
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
    const [orders, setOrders] = useState<any[]>([]);
    const [hasYield, setHasYield] = useState<boolean | null>(null);
    const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        if (selectedPlanId) {
            fetchAllocationMatrix(Number(selectedPlanId));
            setIsSuccess(false);
        } else {
            setMatrix([]);
            setHasYield(null);
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
            // Step 1: Fetch allocation matrix preview for the specific plan
            const { rows, rawOrders } = await allocationApi.previewAllocation(planId);
            
            // Check if any product in the preview has availableQuantity > 0
            // If all available quantities are 0, it means no yield has been actually recorded for these specific products
            // (or it was recorded as 0)
            const hasActualYield = rows.length > 0 && rows.some(r => r.totalAvailable > 0);
            
            setHasYield(hasActualYield);

            if (!hasActualYield) {
                setMatrix([]);
                setOrders([]);
                return;
            }

            setOrders(rawOrders || []);
            setMatrix(rows);
        } catch (error) {
            console.error("Allocation preview error:", error);
            toast.error('Không thể tải dữ liệu điều phối từ lô sản xuất');
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
            setIsSuccess(true);
            
            // Workflow: Hide allocated items by resetting selection after a delay
            setTimeout(() => {
                setMatrix([]);
                setSelectedPlanId('');
                fetchPlans(); // Refresh plan list to exclude processed ones
            }, 1500);
            
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
            return { 
                storeId: id, 
                storeName: a?.storeName || `Cửa hàng ${id}`,
                deliveryDate: a?.deliveryDate
            };
        });

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
                        <Badge variant="orange" className="text-[10px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase">WAREHOUSE MANAGEMENT</Badge>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                        Ma Trận Điều Phối
                    </h1>
                    <p className="text-sm text-zinc-500 font-medium max-w-xl">
                        Tối ưu hóa việc phân bổ thành phẩm từ <span className="text-amber-500 font-bold">Bếp Trung Tâm</span> tới các <span className="text-amber-400 font-bold">Cửa hàng nhượng quyền</span> dựa trên nhu cầu thực tế từ đơn hàng.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/30 p-2 rounded-2xl border border-zinc-800/50">
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Trạng thái</p>
                        <Badge variant="info" className="font-black px-3 py-0.5">COORDINATING</Badge>
                    </div>
                    <div className="w-[1px] h-10 bg-zinc-800"></div>
                    <Button
                        onClick={handleSaveAllocation}
                        disabled={
                            matrix.length === 0 || 
                            isSaving || 
                            isSuccess || 
                            hasYield === false ||
                            matrix.some(row => (row.allocations || []).reduce((s, a) => s + a.allocatedQuantity, 0) > row.totalAvailable)
                        }
                        className={cn(
                            "font-black uppercase text-xs tracking-widest px-8 h-12 rounded-xl shadow-xl border-0 flex items-center gap-2 transition-all active:scale-95",
                            isSuccess 
                                ? "bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 cursor-default" 
                                : "bg-amber-600 hover:bg-amber-500 text-black shadow-amber-900/20",
                            matrix.some(row => (row.allocations || []).reduce((s, a) => s + a.allocatedQuantity, 0) > row.totalAvailable) && "opacity-50 grayscale cursor-not-allowed"
                        )}
                    >
                        {isSaving ? 'Đang lưu...' : isSuccess ? <><CheckCircle size={18} /> Đã phân bổ</> : <><Save size={18} /> Chốt Phân Bổ</>}
                    </Button>
                </div>
            </div>

            {/* Selection & Controls Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-4 bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800/50 flex flex-col justify-center">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-1">Chọn Lô Sản Xuất Cần Điều Phối</label>
                    <div className="relative group">
                        <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <select
                            className="w-full appearance-none pl-12 pr-10 h-14 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all cursor-pointer shadow-inner"
                            value={selectedPlanId}
                            onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : '')}
                            disabled={isLoadingPlans}
                        >
                            <option value="">-- Chọn Kế hoạch sản xuất --</option>
                            {plans.map(p => (
                                <option key={p.planId} value={p.planId}>#{p.planId} - {p.planName} ({p.status})</option>
                            ))}
                        </select>
                        <ArrowRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 rotate-90 pointer-events-none" />
                    </div>
                </div>

                <div className="lg:col-span-8 bg-zinc-900/20 p-5 rounded-3xl border border-zinc-800/30 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Info size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quy tắc</p>
                            <p className="text-[11px] text-zinc-400 font-bold leading-tight">Không vượt quá Max Available của lô hàng.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Truck size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Đối tượng</p>
                            <p className="text-[11px] text-zinc-400 font-bold leading-tight">{storeColumns.length} chi nhánh đang chờ hàng.</p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center border-l border-zinc-800/50 pl-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-zinc-500 uppercase">Thiếu hàng</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-black text-zinc-500 uppercase">Đã tối ưu</span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500/50 w-[65%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Display */}
            <div className="bg-zinc-900/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse border-spacing-0">
                        <thead>
                            <tr className="bg-zinc-900 border-b border-zinc-800">
                                <th className="px-10 py-10 bg-zinc-900 sticky left-0 z-30 border-r border-zinc-800/50 w-[380px] shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-amber-500 border border-zinc-800">
                                            <Package size={24} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-white uppercase tracking-tighter">Sản phẩm đầu ra</span>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Tổng khả dụng (Max)</span>
                                        </div>
                                    </div>
                                </th>
                                {storeColumns.map(col => (
                                    <th key={col.storeId} className="px-8 py-10 min-w-[260px] border-b border-zinc-800/50 bg-zinc-900/50">
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-800">
                                                <Store size={18} />
                                            </div>
                                            <span className="text-sm font-black text-white uppercase tracking-tighter text-center">{col.storeName}</span>
                                            {col.deliveryDate && (
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter mt-1">Ngày nhận hàng: {new Date(col.deliveryDate).toLocaleDateString('vi-VN')}</span>
                                            )}
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1 opacity-60">CHI NHÁNH #{col.storeId}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {isLoadingMatrix ? (
                                <tr>
                                    <td colSpan={storeColumns.length + 1} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative w-16 h-16">
                                                <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-zinc-200 uppercase tracking-widest">Building Allocation Matrix</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase">Hệ thống đang tính toán nhu cầu và khả năng đáp ứng...</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : hasYield === false ? (
                                <tr>
                                    <td colSpan={storeColumns.length + 1} className="px-10 py-40 text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-red-500/5 backdrop-blur-3xl"></div>
                                        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto relative z-10">
                                            <div className="w-24 h-24 rounded-[32px] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/20 animate-pulse">
                                                <AlertCircle size={48} />
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-2xl font-black text-red-400 uppercase tracking-tighter">Chưa có sản lượng sản xuất</p>
                                                <p className="text-sm text-zinc-400 font-bold leading-relaxed px-10">
                                                    Lô sản xuất này hiện chưa có dữ liệu đầu ra (yield). KHÔNG cho phép phân bổ vật tư khi Bếp Trung Tâm chưa ghi nhận sản lượng hoàn thành.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : matrix.length === 0 ? (
                                <tr>
                                    <td colSpan={storeColumns.length + 1} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6 max-w-sm mx-auto opacity-40">
                                            <div className="w-24 h-24 rounded-[32px] bg-zinc-900 flex items-center justify-center text-zinc-700 border border-zinc-800">
                                                <Network size={48} />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xl font-black text-zinc-100 uppercase tracking-tight">Trống Dữ Liệu</p>
                                                <p className="text-xs text-zinc-500 font-medium">Vui lòng chọn một kế hoạch sản xuất đã hoàn tất để thực hiện điều phối kho hàng.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                matrix.map(row => {
                                    const currentTotal = (row.allocations || []).reduce((s, a) => s + a.allocatedQuantity, 0);
                                    const isExceeded = currentTotal > (row.totalAvailable || 0);
                                    const isBalanced = currentTotal === (row.totalAvailable || 0);

                                    return (
                                        <tr key={row.productId} className="hover:bg-zinc-800/30 group transition-all duration-300">
                                            <td className="px-10 py-8 bg-zinc-900/90 backdrop-blur-md sticky left-0 z-20 border-r border-zinc-800/50 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-zinc-100 tracking-tight group-hover:text-amber-500 transition-colors uppercase leading-none mb-1">
                                                        {row.productName}
                                                    </span>
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">ID: #{row.productId}</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "px-4 py-2 rounded-xl flex items-center gap-3 border transition-all",
                                                            isExceeded ? "bg-red-500/10 border-red-500/30 text-red-500" :
                                                                isBalanced ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                                                                    "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                                        )}>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold uppercase opacity-60">Phân bổ</span>
                                                                <span className="text-lg font-black font-mono leading-none">{currentTotal}</span>
                                                            </div>
                                                            <div className="w-[1px] h-6 bg-current opacity-20"></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold uppercase opacity-60">Khả dụng</span>
                                                                <span className="text-lg font-black font-mono leading-none">{row.totalAvailable}</span>
                                                            </div>
                                                        </div>
                                                        {isExceeded && (
                                                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-black animate-bounce shadow-lg shadow-red-500/20">
                                                                <AlertCircle size={18} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {storeColumns.map(col => {
                                                const cell = (row.allocations || []).find((a: any) => a.storeId === col.storeId);
                                                if (!cell) return (
                                                    <td key={col.storeId} className="px-8 py-8 text-center bg-zinc-950/20 italic text-zinc-800 text-[10px] font-black uppercase tracking-widest">
                                                        Không yêu cầu
                                                    </td>
                                                );

                                                const isShortage = cell.allocatedQuantity < cell.requestedQuantity;
                                                const isOptimized = cell.allocatedQuantity === cell.requestedQuantity && cell.requestedQuantity > 0;

                                                return (
                                                    <td key={col.storeId} className={cn(
                                                        "px-8 py-8 transition-colors relative",
                                                        isShortage ? "bg-red-500/[0.02]" : isOptimized ? "bg-emerald-500/[0.02]" : ""
                                                    )}>
                                                        <div className="flex flex-col items-center">
                                                            <div className="relative group/input mb-3">
                                                                <input
                                                                    type="number"
                                                                    className={cn(
                                                                        "w-36 h-16 bg-zinc-950 border-2 rounded-2xl text-center text-xl font-black font-mono focus:outline-none focus:ring-8 transition-all px-4 shadow-2xl",
                                                                        isShortage
                                                                            ? "border-red-500/40 text-red-500 focus:ring-red-500/5 focus:border-red-500"
                                                                            : isOptimized
                                                                                ? "border-emerald-500/40 text-emerald-500 focus:ring-emerald-500/5 focus:border-emerald-500"
                                                                                : "border-zinc-800 text-zinc-100 focus:ring-amber-500/5 focus:border-amber-500"
                                                                    )}
                                                                    value={cell.allocatedQuantity.toString()}
                                                                    onChange={(e) => handleQuantityChange(row.productId, col.storeId, e.target.value)}
                                                                    min={0}
                                                                    max={row.totalAvailable}
                                                                />
                                                                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-10 flex items-center gap-1.5">
                                                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">REQ:</span>
                                                                    <span className="text-[10px] font-black text-zinc-300 font-mono">{cell.requestedQuantity}</span>
                                                                </div>
                                                            </div>

                                                            {isShortage ? (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-in zoom-in-50 duration-500">
                                                                    <AlertCircle size={10} className="text-red-500" />
                                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-tight">Hụt {cell.requestedQuantity - cell.allocatedQuantity} sp</span>
                                                                </div>
                                                            ) : isOptimized ? (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-in zoom-in-50 duration-500">
                                                                    <CheckCircle size={10} className="text-emerald-500" />
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight">Tối ưu</span>
                                                                </div>
                                                            ) : (
                                                                <div className="h-5"></div>
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

                {/* Status Bar */}
                <div className="bg-zinc-900 p-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-8 px-10">
                    <div className="flex items-center gap-12">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 opacity-60">Tổng chi nhánh điều phối</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white">{storeColumns.length}</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter self-end mb-1">Cửa hàng</span>
                            </div>
                        </div>
                        <div className="w-[1px] h-10 bg-zinc-800"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 opacity-60">Tổng sản phẩm</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white">{matrix.length}</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter self-end mb-1">Món hàng</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-lg bg-amber-500/5 p-4 rounded-3xl border border-amber-500/10 flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all">
                            <Info size={18} />
                        </div>
                        <p className="text-[11px] text-zinc-500 font-bold leading-relaxed tracking-tight uppercase">
                            Hệ thống sẽ tự động ngăn chặn việc phân bổ quá giới hạn sản xuất của Bếp Trung Tâm. Hãy chốt phân bổ để bắt đầu quy trình vận chuyển.
                        </p>
                    </div>
                </div>
            </div>

            {/* Allocation Summary Table (Order-based) */}
            {matrix.length > 0 && orders.length > 0 && (
                <div className="bg-zinc-950/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="p-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-amber-500 border border-zinc-800">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Chi tiết Đơn hàng & Phân bổ</h2>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Danh sách phân bổ cụ thể theo từng đơn hàng của chi nhánh</p>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/80 text-[10px] uppercase font-black text-zinc-600 tracking-widest border-b border-zinc-800">
                                    <th className="px-10 py-5">Cửa hàng & Đơn hàng</th>
                                    <th className="px-8 py-5">Sản phẩm yêu cầu</th>
                                    <th className="px-8 py-5 text-center">Tổng SL Phân bổ</th>
                                    <th className="px-10 py-5 text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {orders.map((order, idx) => {
                                    const totalAllocated = (order.items || []).reduce((sum: number, item: any) => sum + (item.proposedQty ?? item.allocatedQuantity ?? 0), 0);
                                    
                                    return (
                                        <tr key={order.orderId || idx} className="hover:bg-zinc-800/20 transition-all group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-colors">
                                                        <Store size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-zinc-100 uppercase tracking-tight">{order.storeName || `Cửa hàng #${order.storeId}`}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">ID: #{order.orderId}</span>
                                                            {order.deliveryDate && (
                                                                <>
                                                                    <div className="w-[1px] h-2 bg-zinc-800"></div>
                                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Ngày nhận hàng: {new Date(order.deliveryDate).toLocaleDateString('vi-VN')}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2 max-w-md">
                                                    {(order.items || []).map((item: any, i: number) => {
                                                        const qty = item.proposedQty ?? item.allocatedQuantity ?? 0;
                                                        if (qty === 0) return null;
                                                        return (
                                                            <div key={i} className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-zinc-300">{item.productName}</span>
                                                                <Badge variant="orange" className="text-[9px] px-1.5 h-4 border-0">
                                                                    x{qty}/{item.requestedQty ?? item.requestedQuantity ?? 0}
                                                                </Badge>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-xl font-black font-mono text-zinc-100">{totalAllocated}</span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black px-4">READY</Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
