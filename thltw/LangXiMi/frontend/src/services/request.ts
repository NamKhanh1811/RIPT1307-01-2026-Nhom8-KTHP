import axios from 'axios';
import { message } from 'antd';
import { storage } from '@/utils/helpers';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
request.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      storage.clear();
      window.location.href = '/login';
      return;
    }
    const msg = error.response?.data?.message || 'Đã có lỗi xảy ra';
    message.error(msg);
    return Promise.reject(error);
  },
);

export default request;
