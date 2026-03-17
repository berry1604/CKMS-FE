import axios from 'axios';
import toast from 'react-hot-toast';
// Force BASE_URL to empty to use Vite proxy
const BASE_URL = '';

const axiosClient = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

// Request interceptor: attach token
axiosClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('accessToken');

        // Do not attach token for public endpoints
        const publicEndpoints = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/activate', '/auth/refresh'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

        if (token && !isPublicEndpoint) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Debounce 403 toast to avoid spamming when multiple API calls fail at once
let last403Toast = 0;

// Response interceptor: handle errors
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const config = error.config;
        const url = config?.url || '';

        // Handle 400 Bad Request
        if (error.response?.status === 400) {
            const message = error.response.data?.message || 'Yêu cầu không hợp lệ.';
            toast.error(message);
        } else if (error.response?.status === 401) {
            // Token expired or invalid
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            // Skip showing toast if we are trying to fetch products/categories (we handle fallback in the component)
            if (!url.includes('/products') && !url.includes('/categories')) {
                const now = Date.now();
                if (now - last403Toast > 3000) {
                    last403Toast = now;
                    toast.error('Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ Admin.');
                }
            }
        }

        return Promise.reject(error);
    }
);


export default axiosClient;
