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

// Refresh token state
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

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
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest?.url || '';

        // Handle 400 Bad Request
        if (error.response?.status === 400) {
            const message = error.response.data?.message || 'Yêu cầu không hợp lệ.';
            toast.error(message);
        } 
        
        // Handle 401 Unauthorized - Token expired or invalid
        else if (error.response?.status === 401 && !originalRequest._retry) {
            // Prevent infinite loops if refresh token itself fails
            if (url.includes('/auth/refresh')) {
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axiosClient(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = sessionStorage.getItem('refreshToken');
            if (!refreshToken) {
                sessionStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Use raw axios to avoid interceptor recursion for the refresh call
                const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
                    refreshToken
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = response.data?.data || response.data;
                const newAccessToken = data.accessToken || data.token;

                if (newAccessToken) {
                    sessionStorage.setItem('accessToken', newAccessToken);
                    // Update header and retry original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    onRefreshed(newAccessToken);
                    return axiosClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        } 
        
        // Handle 403 Forbidden
        else if (error.response?.status === 403) {
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
