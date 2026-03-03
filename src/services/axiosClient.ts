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
        const token = localStorage.getItem('accessToken');

        // Do not attach token for public endpoints
        const publicEndpoints = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/activate'];
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
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            const now = Date.now();
            if (now - last403Toast > 3000) {
                last403Toast = now;
                toast.error('Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ Admin.');
            }
        }

        return Promise.reject(error);
    }
);


export default axiosClient;
