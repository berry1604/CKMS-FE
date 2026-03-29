import { useEffect, useState } from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { productApi } from '../../services/product.api';
import type { ProductResponse as Product } from '../../types/product';
import { RecipeEditor } from './RecipeEditor';

export const RecipeManager = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const prodRes = await productApi.getProducts();
                setProducts(prodRes.data.content || []);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBack = () => {
        setSelectedProduct(null);
    };

    if (selectedProduct) {
        return (
            <RecipeEditor
                product={selectedProduct}
                onBack={handleBack}
            />
        );
    }

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20 pt-4">
            {/* Header Component */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3 italic">
                        <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <FileText size={26} className="text-amber-500" />
                        </div>
                        Quản lý <span className="text-amber-500">Công thức</span>
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)]/60 mt-1 font-medium uppercase tracking-[0.2em] ml-1">Quản lý định lượng và quy trình chế biến sản phẩm</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group/search">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]/40 group-focus-within/search:text-amber-500/50 transition-colors" size={18} />
                        <Input
                            placeholder="Tìm kiếm sản phẩm..."
                            className="h-12 pl-12 bg-[var(--bg-card)]/40 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse">Đang tải dữ liệu...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <Card className="p-16 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] text-center border-dashed">
                    <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/10">
                        <Search className="text-amber-500/20" size={40} />
                    </div>
                    <h3 className="text-[var(--text-primary)] font-black uppercase tracking-wider mb-2">Không tìm thấy sản phẩm</h3>
                    <p className="text-[var(--text-secondary)]/40 text-xs font-medium italic">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="p-6 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[30px] shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative shrink-0">
                                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <img
                                        src={product.imageUrl || ''}
                                        alt={product.name}
                                        className="w-20 h-20 rounded-2xl object-cover bg-[var(--bg-root)] border border-[var(--border-primary)] group-hover:border-amber-500/30 transition-all relative z-10"
                                    />
                                </div>
                                
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="font-black text-[var(--text-primary)] uppercase tracking-tight group-hover:text-amber-500 transition-colors">{product.name}</h3>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md uppercase tracking-widest border border-amber-500/20">
                                            {product.category?.name ?? 'Chưa phân loại'}
                                        </span>
                                        <span className="text-[9px] font-black text-[var(--text-secondary)]/40 bg-[var(--bg-root)]/50 px-2 py-1 rounded-md uppercase tracking-widest border border-[var(--border-primary)]">
                                            {product.unit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[var(--border-primary)]/40">
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedProduct(product)}
                                    className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5 transition-all"
                                >
                                    <FileText size={16} className="mr-2" />
                                    Xem chi tiết
                                </Button>
                                <Button
                                    onClick={() => setSelectedProduct(product)}
                                    className="flex-1 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black hover:border-amber-500 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Thiết lập
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>

    );
};
