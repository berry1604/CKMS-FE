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
            toast.error('Access Denied. You do not have permission to perform this action.');
        }

        return Promise.reject(error);
    }
);


export default axiosClient;
