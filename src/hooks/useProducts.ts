import { useState, useCallback, useEffect } from 'react';
import { productApi } from '../services/product.api';
import type { ProductResponse, Page } from '../types/product';
import toast from 'react-hot-toast';

export const useProducts = (initialSize = 10) => {
    const [data, setData] = useState<Page<ProductResponse> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(initialSize);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
    const [sort, setSort] = useState<string | undefined>(undefined);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await productApi.getProducts({
                page,
                size,
                search: search || undefined,
                categoryId,
                sort
            });
            setData(res.data);
        } catch (error: any) {
            console.error('Failed to fetch products', error);
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error('Failed to load products');
            }
        } finally {
            setIsLoading(false);
        }
    }, [page, size, search, categoryId, sort]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return {
        products: data?.content || [],
        pageableInfo: data ? {
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            size: data.size,
            number: data.number,
            first: data.first,
            last: data.last
        } : null,
        isLoading,
        page,
        setPage,
        size,
        setSize,
        search,
        setSearch,
        categoryId,
        setCategoryId,
        sort,
        setSort,
        refetch: fetchProducts
    };
};
