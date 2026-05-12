import request from './request';
import type { ApiResponse, Job, JobFilter, PaginationParams } from '@/types';

export const jobService = {
  // Public
  getJobs: (params?: JobFilter & PaginationParams) =>
    request.get<never, ApiResponse<Job[]>>('/jobs', { params }),

  getJobById: (id: number) =>
    request.get<never, ApiResponse<Job>>(`/jobs/${id}`),

  // Employer
  createJob: (data: Partial<Job>) =>
    request.post<never, ApiResponse<Job>>('/jobs', data),

  updateJob: (id: number, data: Partial<Job>) =>
    request.put<never, ApiResponse<Job>>(`/jobs/${id}`, data),

  deleteJob: (id: number) =>
    request.delete<never, ApiResponse<null>>(`/jobs/${id}`),

  getMyJobs: () =>
    request.get<never, ApiResponse<Job[]>>('/jobs/my'),

  // Admin
  approveJob: (id: number) =>
    request.patch<never, ApiResponse<Job>>(`/admin/jobs/${id}/approve`),

  rejectJob: (id: number, reason?: string) =>
    request.patch<never, ApiResponse<Job>>(`/admin/jobs/${id}/reject`, { reason }),
};
