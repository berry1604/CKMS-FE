import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Calendar as CalendarIcon, ChevronRight, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { storeOrderApi } from '../../services/storeOrderApi';
import { productionPlanApi } from '../../services/productionPlan.api';
import { useAuth } from '../../hooks/useAuth';
import type { StoreOrderResponse } from '../../types/storeOrder';



export const CreateTaskPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Wizard State
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Form Data
    const [plannedDate, setPlannedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedKitchenId, setSelectedKitchenId] = useState<number | ''>(user?.kitchenId || 1);
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());



    useEffect(() => {
        if (step === 2 && orders.length === 0) {
            fetchPendingOrders();
        }
    }, [step]);

    const fetchPendingOrders = async () => {
        setIsLoadingOrders(true);
        try {
            const res = await storeOrderApi.getAllOrders({ status: 'APPROVED', size: 100 });
            // Fallback to confirmed if approved doesn't exist depending on API terminology
            const validStatuses = ['APPROVED', 'SUBMITTED'];
            const pending = (res.content || []).filter(o => validStatuses.includes(o.status.toUpperCase()));
            setOrders(pending);
        } catch (error) {
            toast.error("Không thể tải danh sách đơn hàng.");
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const toggleSelection = (orderId: number) => {
        const newSet = new Set(selectedOrderIds);
        if (newSet.has(orderId)) newSet.delete(orderId);
        else newSet.add(orderId);
        setSelectedOrderIds(newSet);
    };

    const toggleAll = () => {
        if (selectedOrderIds.size === orders.length) setSelectedOrderIds(new Set());
        else setSelectedOrderIds(new Set(orders.map(o => o.orderId)));
    };

    // Calculate aggregated demand for Step 3
    const aggregatedDemand = useMemo(() => {
        const demandMap = new Map<string, { quantity: number; unitPrice: number }>();

        const selected = orders.filter(o => selectedOrderIds.has(o.orderId));
        selected.forEach(order => {
            (order.orderDetails || []).forEach(item => {
                const name = item.productName || `Product #${item.productId}`;
                if (demandMap.has(name)) {
                    demandMap.get(name)!.quantity += item.quantity;
                } else {
                    demandMap.set(name, { quantity: item.quantity, unitPrice: item.unitPrice });
                }
            });
        });

        return Array.from(demandMap.entries()).map(([name, data]) => ({ name, ...data }));
    }, [orders, selectedOrderIds]);

    const onSubmit = async () => {
        if (selectedOrderIds.size === 0 || !selectedKitchenId) return;
        setIsSubmitting(true);
        try {
            await productionPlanApi.createProductionPlan({
                kitchenId: Number(selectedKitchenId),
                plannedDate,
                storeOrderIds: Array.from(selectedOrderIds)
            });
            toast.success('Kế hoạch sản xuất đã được tạp (CREATED). Orders LOCKED.');
            navigate('/kitchen');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Tạo kế hoạch thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/kitchen')} className="hover:bg-zinc-800/80 rounded-full p-2 h-auto">
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <CalendarIcon size={24} className="text-amber-600" />
                        Tạo Kế hoạch sản xuất
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Phân bổ chỉ tiêu sản xuất cho Bếp trung tâm.</p>
                </div>
            </div>

            {/* Wizard Progress */}
            <div className="flex items-center justify-between relative px-10 mb-8 mt-4">
                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-zinc-800 -z-10 -translate-y-1/2">
                    <div className="h-full bg-amber-600 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                </div>
                {[1, 2, 3].map(num => (
                    <div key={num} className={`flex flex-col items-center gap-2 ${step >= num ? 'text-amber-500' : 'text-gray-500'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= num ? 'border-amber-500 bg-zinc-900 text-amber-500' : 'border-zinc-700 bg-zinc-900 text-gray-500'
                            } ${step === num ? 'ring-4 ring-amber-500/20 shadow-lg' : ''}`}>
                            {step > num ? <CheckCircle2 size={18} className="text-amber-500" /> : num}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider hidden sm:block">
                            {num === 1 ? 'Chọn Bếp' : num === 2 ? 'Chọn Đơn hàng' : 'Tổng hợp Demand'}
                        </span>
                    </div>
                ))}
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-700 bg-zinc-900/50">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95">
                        <h2 className="text-lg font-bold text-gray-200">Bước 1: Chọn Bếp & Ngày</h2>
                        <p className="text-sm text-gray-400">Chỉ định bếp trung tâm chịu trách nhiệm và ngày dự kiến thực hiện quy trình sản xuất.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Bếp Trung Tâm</label>
                                <select
                                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-amber-500"
                                    value={selectedKitchenId}
                                    onChange={(e) => setSelectedKitchenId(Number(e.target.value) || '')}
                                >
                                    <option value="">-- Chọn Bếp --</option>
                                    <option value={1}>Bếp Trung Tâm Gò Vấp</option>
                                    <option value={2}>Bếp Trung Tâm Quận 1</option>
                                    <option value={3}>Bếp Trung Tâm Thủ Đức</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Ngày sản xuất dự kiến</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={plannedDate}
                                    onChange={(e) => setPlannedDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => setStep(2)}
                                disabled={!selectedKitchenId || !plannedDate}
                            >
                                Tiếp tục <ChevronRight size={16} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-200">Bước 2: Chọn Đơn hàng Cần Sản Xuất</h2>
                                <p className="text-sm text-gray-400">Chọn các đơn hàng đã Approved để gom thành một mẻ.</p>
                            </div>
                            <div className="text-amber-500 font-semibold text-sm bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                Đã chọn: {selectedOrderIds.size} / {orders.length}
                            </div>
                        </div>

                        <div className="border border-zinc-700 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-10 text-center">
                                            <input type="checkbox" className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" checked={selectedOrderIds.size === orders.length && orders.length > 0} onChange={toggleAll} />
                                        </th>
                                        <th className="px-4 py-3">Mã đơn</th>
                                        <th className="px-4 py-3">Cửa hàng</th>
                                        <th className="px-4 py-3">Danh sách món</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800 text-sm">
                                    {isLoadingOrders ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                                    ) : orders.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Không có đơn hàng nào chờ sản xuất.</td></tr>
                                    ) : (
                                        orders.map(order => (
                                            <tr key={order.orderId} className={`hover:bg-zinc-800/50 cursor-pointer ${selectedOrderIds.has(order.orderId) ? 'bg-amber-500/5' : ''}`} onClick={() => toggleSelection(order.orderId)}>
                                                <td className="px-4 py-3 text-center">
                                                    <input type="checkbox" className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" checked={selectedOrderIds.has(order.orderId)} readOnly />
                                                </td>
                                                <td className="px-4 py-3 font-mono text-gray-400">#{order.orderId}</td>
                                                <td className="px-4 py-3 text-gray-200 font-medium">{order.storeName || `Store #${order.storeId}`}</td>
                                                <td className="px-4 py-3 text-gray-400">
                                                    {order.orderDetails?.map(i => `${i.productName} (x${i.quantity})`).join(', ') || 'No items'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft size={16} className="mr-1" /> Quay lại</Button>
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setStep(3)} disabled={selectedOrderIds.size === 0}>
                                Xem Demand <ChevronRight size={16} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div>
                            <h2 className="text-lg font-bold text-gray-200">Bước 3: Preview Aggregated Demand</h2>
                            <p className="text-sm text-gray-400">Tổng hợp mẻ sản xuất cần làm từ các đơn hàng đã chọn.</p>
                        </div>

                        <div className="border border-zinc-700 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Món Sản Xuất (Dish)</th>
                                        <th className="px-6 py-3 text-right">Tổng Số Lượng Cần (Quantity)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800 text-sm">
                                    {aggregatedDemand.map((item, i) => (
                                        <tr key={i} className="hover:bg-zinc-800/30">
                                            <td className="px-6 py-4 font-medium text-gray-200">{item.name}</td>
                                            <td className="px-6 py-4 text-right font-bold text-amber-500 text-base">{item.quantity}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-zinc-900/80">
                                        <td className="px-6 py-3 font-bold text-gray-400 text-right">Total Items</td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-200">{aggregatedDemand.reduce((s, i) => s + i.quantity, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between pt-4 mt-4 border-t border-zinc-800 items-center">
                            <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}><ArrowLeft size={16} className="mr-1" /> Quay lại</Button>
                            <Button
                                onClick={onSubmit}
                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang tạo...' : <><Save size={16} className="mr-2" /> Tạo Production Plan</>}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
