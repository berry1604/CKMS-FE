import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart, Package, Search, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { productApi } from '../../services/product.api';
import { categoryApi } from '../../services/category.api';
import type { ProductResponse as Product } from '../../types/product';
import type { CategoryResponse as Category } from '../../types/category';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { OrderItemRequest } from '../../types/storeOrder';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/classNames';

export const CreateOrder = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cart, setCart] = useState<(OrderItemRequest & { productName: string, price: number, unit: string })[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchProduct, setSearchProduct] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        const fetchCategories = categoryApi.getAll().catch(err => {
            console.warn('Fallback categories due to error:', err);
            return [
                { id: 1, name: 'Món Chính', description: 'Các món ăn chính', status: 'ACTIVE' },
                { id: 2, name: 'Đồ Cơm', description: 'Các loại cơm', status: 'ACTIVE' },
                { id: 3, name: 'Đồ Uống', description: 'Nước giải khát', status: 'ACTIVE' },
            ] as Category[];
        });

        const fetchProducts = productApi.getProducts({ size: 100 }).catch(err => {
            console.warn('Fallback products due to error:', err);
            return {
                data: {
                    content: [
                        { id: 1, name: 'Cơm Gà Xối Mỡ', category: { id: 2, name: 'Đồ Cơm' }, price: 45000, unit: 'phần', isActive: true, imageUrl: '' },
                        { id: 2, name: 'Trà Sữa Oolong', category: { id: 3, name: 'Đồ Uống' }, price: 25000, unit: 'ly', isActive: true, imageUrl: '' },
                        { id: 3, name: 'Bít Tết Sốt Tiêu', category: { id: 1, name: 'Món Chính' }, price: 95000, unit: 'phần', isActive: true, imageUrl: '' },
                        { id: 4, name: 'Nước Ép Cam', category: { id: 3, name: 'Đồ Uống' }, price: 30000, unit: 'ly', isActive: true, imageUrl: '' },
                        { id: 5, name: 'Bún Bò Huế', category: { id: 1, name: 'Món Chính' }, price: 50000, unit: 'phần', isActive: true, imageUrl: '' },
                        { id: 6, name: 'Cơm Sườn Bì Chả', category: { id: 2, name: 'Đồ Cơm' }, price: 60000, unit: 'phần', isActive: true, imageUrl: '' },
                    ]
                }
            } as any;
        });

        Promise.all([fetchProducts, fetchCategories]).then(([prodRes, catData]) => {
            setProducts(prodRes.data?.content || []);
            setCategories(catData || []);
        });
    }, []);

    const handleAddToCart = (product: Product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unit: product.unit || 'phần',
                price: product.price
            }]);
        }
        toast.success(`Đã thêm ${product.name}`, { duration: 1000, position: 'bottom-right' });
    };

    const handleQuantityChange = (productId: number, val: number) => {
        if (val <= 0) {
            setCart(cart.filter(i => i.productId !== productId));
        } else {
            setCart(cart.map(item => item.productId === productId ? { ...item, quantity: val } : item));
        }
    };

    const handleRemove = (productId: number) => {
        setCart(cart.filter(i => i.productId !== productId));
    };

    const totals = useMemo(() => {
        return {
            price: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
            quantity: cart.reduce((sum, item) => sum + item.quantity, 0)
        };
    }, [cart]);

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error('Giỏ hàng trống. Vui lòng thêm sản phẩm.');
            return;
        }
        if (!user?.storeId) {
            toast.error('Tài khoản của bạn chưa được gán vào cửa hàng nào.');
            return;
        }
        if (!deliveryDate) {
            toast.error('Vui lòng chọn ngày giao hàng.');
            return;
        }

        const payload = {
            storeId: Number(user.storeId),
            deliveryDate,
            note,
            items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))
        };

        setIsSubmitting(true);
        try {
            await storeOrderApi.createOrder(payload);
            toast.success('Tạo bản nháp thành công! Vui lòng gửi đơn để được duyệt.');
            navigate('/orders');
        } catch (error: any) {
            console.error('Failed to submit order', error);
            const backendMsg = error.response?.data?.message || error.message;
            toast.error(`Đặt đơn hàng thất bại: ${backendMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase());
        const matchesCategory = selectedCategoryId ? p.category?.id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col relative">
            {/* Cinematic Overall Backdrop (subtle) */}
            <div className="absolute inset-[-4rem] bg-gradient-to-br from-amber-500/5 via-transparent to-teal-500/5 -z-10 blur-3xl rounded-full pointer-events-none opacity-50"></div>

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 animate-in fade-in duration-700">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/orders')} className="hover:bg-zinc-800 rounded-full w-10 h-10 p-0 shadow-lg border border-zinc-800/50">
                        <ArrowLeft size={20} className="text-zinc-400 group-hover:text-amber-500 transition-colors" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Tạo Đơn Hàng</h1>
                        <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase mt-1">Terminal: <span className="text-amber-500">{user?.storeName || 'Franchise Node'}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-amber-500/30 shadow-lg shadow-amber-500/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Draft Mode Active</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 animate-in slide-in-from-bottom-8 duration-700">
                {/* Product Catalog Column */}
                <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 flex flex-col border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-3xl overflow-hidden rounded-[32px] shadow-2xl relative">
                        {/* Top Gradient Accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>

                        {/* Search & Filter Bar */}
                        <div className="p-6 border-b border-zinc-800/50 bg-zinc-950/20 space-y-5 relative z-10">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                                <Input
                                    placeholder="Truy vấn danh mục ẩm thực..."
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    className="pl-12 bg-zinc-950/50 border-zinc-800/80 focus:border-amber-500/50 transition-all rounded-2xl h-12 text-sm text-zinc-200 placeholder:text-zinc-600 shadow-inner"
                                />
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                <div className="flex items-center gap-2 pr-3 border-r border-zinc-800 mr-1 shrink-0">
                                    <Filter size={16} className="text-amber-500" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Phân loại</span>
                                </div>
                                <button
                                    onClick={() => setSelectedCategoryId(null)}
                                    className={cn(
                                        "px-5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap tracking-widest uppercase border",
                                        selectedCategoryId === null
                                            ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                            : "bg-zinc-950/50 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                                    )}
                                >
                                    Toàn bộ
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={cn(
                                            "px-5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap uppercase tracking-widest border",
                                            selectedCategoryId === cat.id
                                                ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                                : "bg-zinc-950/50 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                                        )}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative z-0">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="group bg-zinc-950/50 rounded-[24px] border border-zinc-800/80 overflow-hidden hover:border-amber-500/50 transition-all duration-500 flex flex-col hover:shadow-[0_10px_40px_rgba(245,158,11,0.1)] hover:-translate-y-1 relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none"></div>
                                        <div className="h-36 bg-zinc-900 relative overflow-hidden z-10 border-b border-zinc-800/50">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-950">
                                                    <Package size={36} strokeWidth={1} className="mb-2 opacity-50" />
                                                    <span className="text-[8px] font-mono tracking-widest uppercase opacity-30">NO IMAGE</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                            
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                                                <Button
                                                    size="sm"
                                                    className="bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] tracking-widest uppercase rounded-xl px-5 py-4 border-0 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                                    onClick={() => handleAddToCart(product)}
                                                >
                                                    <Plus size={16} className="mr-1.5" /> Thêm vào đơn
                                                </Button>
                                            </div>

                                            {product.category && (
                                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/80 text-[9px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/20 backdrop-blur-md shadow-lg">
                                                    {product.category.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col space-y-2 relative z-10 bg-zinc-950/30">
                                            <h3 className="font-bold text-zinc-100 text-[13px] leading-tight group-hover:text-amber-400 transition-colors">{product.name}</h3>
                                            <div className="flex justify-between items-end mt-auto pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Đơn giá</span>
                                                    <span className="text-amber-500 font-black text-base tracking-tight">{(product.price || 0).toLocaleString()} <span className="text-[10px] opacity-60 font-medium">VNĐ</span></span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">/ {product.unit || 'phần'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                                        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                            <Search size={32} className="opacity-50" />
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Hệ thống không tìm thấy kết quả</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cart Terminal Column */}
                <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
                    <div className="flex flex-col border border-zinc-800/50 bg-zinc-950/80 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-2xl shrink-0 min-h-min h-full relative group/cart">
                        {/* Cinematic Cart Header Image */}
                        <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden z-0">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950 z-10"></div>
                            <img 
                                src="/src/assets/order_creation_luxury.png" 
                                alt="Digital Terminal" 
                                className="w-full h-full object-cover opacity-30 transform group-hover/cart:scale-105 transition-transform duration-[3s] ease-out mix-blend-screen"
                            />
                        </div>

                        <div className="p-6 border-b border-zinc-800/30 flex items-end justify-between shrink-0 relative z-10 h-32">
                            <div className="flex flex-col gap-2">
                                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 w-fit backdrop-blur-md">
                                    <ShoppingCart size={20} className="text-amber-500" />
                                </div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter drop-shadow-md">Giỏ Hàng <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Terminal</span></h2>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Selected Items</span>
                                <Badge variant="secondary" className="bg-zinc-900/80 text-amber-500 border-amber-500/30 backdrop-blur-md px-3 py-1 font-black shadow-lg">
                                    {cart.length} mục
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar relative z-10">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4 opacity-40">
                                    <ShoppingCart size={48} strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Trạng thái chờ lệnh</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.productId} className="flex gap-4 p-4 bg-zinc-900/60 backdrop-blur-md rounded-[20px] border border-zinc-800/80 group hover:border-amber-500/30 hover:bg-zinc-900 transition-all shadow-sm relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-zinc-100 text-[13px] truncate pr-4">{item.productName}</p>
                                                <button
                                                    onClick={() => handleRemove(item.productId)}
                                                    className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-all shrink-0"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-[11px] text-zinc-500 font-medium">
                                                    {item.price.toLocaleString()}đ <span className="opacity-30 mx-1">|</span> <span className="uppercase text-[9px] tracking-widest">{item.unit}</span>
                                                </div>
                                                <span className="font-black text-amber-500 text-sm tracking-tight drop-shadow-sm">{(item.quantity * item.price).toLocaleString()} <span className="text-[9px] font-medium text-amber-500/60 uppercase">VNĐ</span></span>
                                            </div>
                                            <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-800/80 w-fit p-1 shadow-inner">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-bold text-lg"
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                >-</button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        if (!isNaN(val) && val >= 1) {
                                                            handleQuantityChange(item.productId, val);
                                                        }
                                                    }}
                                                    className="text-[13px] font-black w-14 text-center bg-transparent text-white focus:outline-none"
                                                />
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-bold text-lg"
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Order Confirmation Panel */}
                        <div className="p-6 bg-zinc-950/90 border-t border-zinc-800/80 space-y-6 relative z-10 backdrop-blur-xl">
                            <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest border-b border-zinc-800/50 pb-3">
                                    <span className="text-zinc-500">Tổng quy mô đơn:</span>
                                    <span className="text-zinc-200 bg-zinc-800 px-3 py-1 rounded-md">{totals.quantity.toLocaleString()} phần</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-1">
                                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Tổng chi phí:</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-amber-500 tracking-tighter drop-shadow-md">{totals.price.toLocaleString()}</span>
                                        <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">VNĐ</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        <div className="w-1 h-3 bg-amber-500 rounded-full"></div>
                                        Ngày giao chỉ định *
                                    </label>
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-amber-500 font-black text-sm px-4 py-3.5 rounded-xl focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all cursor-pointer shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        <div className="w-1 h-3 bg-zinc-600 rounded-full"></div>
                                        Lệnh phân phối (Ghi chú)
                                    </label>
                                    <textarea
                                        placeholder="Để lại chỉ thị cho bộ phận điều phối..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-[13px] px-4 py-3.5 rounded-xl focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all resize-none h-24 shadow-inner"
                                    />
                                </div>
                                
                                <Button
                                    className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-[13px] uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98] border-0"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || cart.length === 0 || !user?.storeId}
                                    isLoading={isSubmitting}
                                >
                                    <Save size={18} className="mr-2" /> 
                                    {isSubmitting ? 'ĐANG XỬ LÝ...' : 'PHÁT LỆNH TẠO ĐƠN'}
                                </Button>

                                {!user?.storeId && (
                                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">
                                            Security Alert: Unassigned Terminal Node
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
