import request from './request';
import type { ApiResponse, User, LoginPayload, RegisterPayload } from '@/types';

export const authService = {
  login: (payload: LoginPayload) =>
    request.post<never, ApiResponse<{ token: string; user: User }>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    request.post<never, ApiResponse<{ token: string; user: User }>>('/auth/register', payload),

  getMe: () =>
    request.get<never, ApiResponse<User>>('/auth/me'),

  logout: () =>
    request.post<never, ApiResponse<null>>('/auth/logout'),
};
