import { useEffect, useState } from 'react';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { productApi } from '../../services/product.api';
import type { ProductResponse as Product } from '../../types/product';
import { recipeService, type Recipe } from '../../services/mock/recipe.mock';
import { RecipeEditor } from './RecipeEditor';

export const RecipeManager = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [prodRes, recipeRes] = await Promise.all([
                    productApi.getProducts(),
                    recipeService.getRecipes()
                ]);
                setProducts(prodRes.data.content || []);
                setRecipes(recipeRes.data);
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

    const getRecipeForProduct = (productId: number) => {
        return recipes.find(r => r.productId === String(productId));
    };

    const handleBack = () => {
        setSelectedProduct(null);
        // Refresh data
        recipeService.getRecipes().then(res => setRecipes(res.data));
    };

    if (selectedProduct) {
        const existingRecipe = getRecipeForProduct(selectedProduct.id);
        return (
            <RecipeEditor
                product={selectedProduct}
                existingRecipe={existingRecipe}
                onBack={handleBack}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Recipe Management</h1>
                <div className="flex space-x-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Search products..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter size={16} className="mr-2" /> Filter
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.map(product => {
                        const recipe = getRecipeForProduct(product.id);
                        return (
                            <div
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                                className="cursor-pointer"
                            >
                                <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={product.imageUrl || ''}
                                            alt={product.name}
                                            className="w-12 h-12 rounded-md object-cover bg-gray-100"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                            <p className="text-sm text-gray-500">Cat {product.category?.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Recipe Status</p>
                                            <Badge variant={recipe?.status === 'active' ? 'success' : (recipe ? 'warning' : 'secondary')}>
                                                {recipe ? recipe.status.toUpperCase() : 'NO RECIPE'}
                                            </Badge>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm text-gray-500">Cost</p>
                                            <p className="font-medium">{recipe ? `$${recipe.totalCost.toFixed(2)}` : '-'}</p>
                                        </div>
                                        <ChevronRight className="text-gray-400" />
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
