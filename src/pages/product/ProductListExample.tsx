import React, { useEffect, useState } from 'react';
import { productApi } from '../../services/product.api';
import type { ProductResponse } from '../../types/product';

export const ProductListExample: React.FC = () => {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await productApi.getProducts({
                page: 0,
                size: 10,
            });

            // Assuming ApiResponse contains 'data' representing the Page object, 
            // and Page contains 'content' array
            if (response && response.data && Array.isArray(response.data.content)) {
                setProducts(response.data.content);
            } else {
                setProducts([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching products.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                <span className="ml-2 text-gray-400">Loading products...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-center">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Product List Example</h2>

            {products.length === 0 ? (
                <p className="text-gray-400">No products found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="bg-zinc-900/50/5 border border-white/10 rounded-xl p-5 hover:border-amber-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${product.isActive
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                {product.description || 'No description available'}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xl font-bold text-amber-500">
                                    ${product.price.toLocaleString()}
                                </span>

                                <button className="text-sm text-amber-400 hover:text-amber-300">
                                    View Details →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductListExample;
