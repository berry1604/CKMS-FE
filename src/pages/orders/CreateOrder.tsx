import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { productApi } from '../../services/product.api';
import type { ProductResponse as Product } from '../../types/product';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { OrderItemRequest, StoreSimpleResponse } from '../../types/storeOrder';

export const CreateOrder = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<(OrderItemRequest & { productName: string, price: number, unit: string })[]>([]);
    const [storeId, setStoreId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchProduct, setSearchProduct] = useState('');
    const [stores, setStores] = useState<StoreSimpleResponse[]>([]);

    useEffect(() => {
        productApi.getProducts().then(res => setProducts(res.data.content || []));
        storeOrderApi.getMyStores().then(res => {
            setStores(res || []);
            if (res && res.length > 0) {
                setStoreId(String(res[0].id));
            }
        });
    }, []);

    const handleAddToCart = (productId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            const newCart = cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
            setCart(newCart);
        } else {
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unit: 'pcs',
                price: product.price
            }]);
        }
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

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        if (!storeId || isNaN(Number(storeId))) {
            alert('Please enter a valid numeric Store ID');
            return;
        }
        if (!confirm('Submit this order?')) return;

        setIsSubmitting(true);
        try {
            await storeOrderApi.createOrder({
                storeId: Number(storeId),
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            });
            navigate('/orders');
        } catch (error) {
            console.error('Failed to submit order', error);
            alert('Failed to submit order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        String(p.category?.id).includes(searchProduct)
    );

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 shrink-0">
                <Button variant="ghost" onClick={() => navigate('/orders')} className="hover:bg-zinc-800/80 rounded-full p-2">
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Create New Order</h1>
                    <p className="text-sm text-gray-400">Select products to replenish your store inventory.</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Product Catalog Column */}
                <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                    <Card className="flex-1 flex flex-col border-0 shadow-sm ring-1 ring-zinc-700 overflow-hidden bg-zinc-900/50">
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
                            <Input
                                placeholder="Search products by name or category..."
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                icon={<SearchIcon size={16} className="text-gray-400" />}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-zinc-900/80/50">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="group bg-zinc-900/50 rounded-xl border border-zinc-700 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
                                        <div className="h-32 bg-gray-100 relative">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                                    <Package size={24} />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                className="absolute bottom-2 right-2 bg-amber-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-semibold text-gray-200 text-sm line-clamp-2">{product.name}</h3>
                                                <span className="font-bold text-gray-200 text-sm ml-2">${product.price.toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">Category: {product.category?.id}</p>
                                            <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                                                <span>pcs</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Cart & Details Column */}
                <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
                    <Card className="flex-1 flex flex-col border-0 shadow-sm ring-1 ring-zinc-700 overflow-hidden bg-zinc-900/50">
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
                            <ShoppingCart size={18} className="text-amber-600" />
                            <h2 className="font-bold text-gray-200">Current Order</h2>
                            <Badge variant="secondary" className="ml-auto">{cart.length} items</Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-900/50">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
                                    <ShoppingCart size={40} />
                                    <p className="text-sm">Your cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.productId} className="flex gap-3 items-start bg-zinc-900/80 p-2 rounded-lg group">
                                        <div className="h-12 w-12 bg-zinc-900/50 rounded border border-zinc-700 flex items-center justify-center shrink-0">
                                            <Package size={16} className="text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <p className="font-medium text-gray-200 text-sm truncate pr-2">{item.productName}</p>
                                                <span className="font-bold text-gray-200 text-sm">${(item.quantity * item.price).toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">${item.price} / {item.unit}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-zinc-900/50 rounded border border-zinc-700 h-7">
                                                    <button
                                                        className="px-2 text-gray-400 hover:bg-zinc-900/80 hover:text-gray-300 h-full"
                                                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                    >-</button>
                                                    <span className="text-xs font-medium w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        className="px-2 text-gray-400 hover:bg-zinc-900/80 hover:text-gray-300 h-full"
                                                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                    >+</button>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(item.productId)}
                                                    className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-zinc-900/80 border-t border-zinc-700 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Tax (0%)</span>
                                    <span className="font-medium">$0.00</span>
                                </div>
                                <div className="pt-2 border-t border-zinc-700 flex justify-between text-base">
                                    <span className="font-bold text-gray-200">Total</span>
                                    <span className="font-bold text-amber-600 text-lg">${calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <hr className="border-zinc-700" />

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Store ID</label>
                                    <select
                                        value={storeId}
                                        onChange={(e) => setStoreId(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-gray-200 text-sm rounded-md focus:ring-amber-500 focus:border-amber-500 p-2.5"
                                    >
                                        <option value="" disabled>Select a store</option>
                                        {stores.map(store => (
                                            <option key={store.id} value={store.id}>{store.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">Select the store destination for this order</p>
                                </div>
                                <Button className="w-full bg-amber-600 hover:bg-blue-700 text-white shadow-sm mt-2" onClick={handleSubmit} disabled={isSubmitting || cart.length === 0} isLoading={isSubmitting}>
                                    <Save size={16} className="mr-2" /> Submit Order
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Helper Icon
const SearchIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
