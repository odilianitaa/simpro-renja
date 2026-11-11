import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000
});

// Request Interceptor: Otomatis menyematkan Supabase JWT Token ke Authorization header
api.interceptors.request.async = true;
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('[API Interceptor] Gagal mengambil session token:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Menangani error 401 (Unauthenticated)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan pada jaringan';
    return Promise.reject({
      ...error,
      customMessage,
      status: error.response?.status
    });
  }
);

export default api;

