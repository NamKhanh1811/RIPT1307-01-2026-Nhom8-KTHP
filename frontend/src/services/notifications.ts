import request from './request';
import type { ApiResponse, Notification } from '@/types';

export const notificationService = {
  getMyNotifications: () =>
    request.get<never, ApiResponse<Notification[]>>('/notifications'),

  markAsRead: (id: number) =>
    request.patch<never, ApiResponse<null>>(`/notifications/${id}/read`),

  markAllRead: () =>
    request.patch<never, ApiResponse<null>>('/notifications/read-all'),
};
