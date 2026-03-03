import { useEffect, useState } from 'react';
import { Search, Filter, Plus, FileText } from 'lucide-react';
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-200">Quản lý Công thức</h1>
                <div className="flex space-x-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Tìm kiếm sản phẩm..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter size={16} className="mr-2" /> Bộ lọc
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-400">Đang tải...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Không tìm thấy sản phẩm nào.</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-4">
                                <img
                                    src={product.imageUrl || ''}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-md object-cover bg-gray-100"
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-200">{product.name}</h3>
                                    <p className="text-sm text-gray-400">{product.category?.name ?? 'Chưa phân loại'} · {product.unit}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedProduct(product)}
                                    className="text-gray-300 hover:text-gray-100"
                                >
                                    <FileText size={15} className="mr-1.5" />
                                    Xem công thức
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    <Plus size={15} className="mr-1.5" />
                                    Tạo công thức
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
