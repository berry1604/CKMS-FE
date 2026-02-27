import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/product';
import type { RecipeRequest, RecipeResponse } from '../types/recipe';

export const recipeApi = {
    createRecipe: async (data: RecipeRequest): Promise<ApiResponse<RecipeResponse>> => {
        try {
            const response = await axiosClient.post<ApiResponse<RecipeResponse>>('/recipes', data);
            return response.data;
        } catch (error) {
            console.error('Error creating recipe:', error);
            throw error;
        }
    },

    getActiveRecipe: async (productId: number | string): Promise<ApiResponse<RecipeResponse>> => {
        try {
            const response = await axiosClient.get<ApiResponse<RecipeResponse>>(`/recipes/product/${productId}/active`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching recipe for product ${productId}:`, error);
            throw error;
        }
    },
};
