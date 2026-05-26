import request from './request';
import type { ApiResponse, Application, ApplicationStatus } from '@/types';

export const applicationService = {
  // Student
  apply: (jobId: number) =>
    request.post<never, ApiResponse<Application>>('/applications', { jobId }),

  getMyApplications: () =>
    request.get<never, ApiResponse<Application[]>>('/applications/my'),

  // Employer
  getApplicationsByJob: (jobId: number) =>
    request.get<never, ApiResponse<Application[]>>(`/applications/job/${jobId}`),

  updateStatus: (id: number, status: ApplicationStatus, note?: string) =>
    request.patch<never, ApiResponse<Application>>(`/applications/${id}/status`, {
      status,
      note,
    }),

  // Admin
  getAllApplications: () =>
    request.get<never, ApiResponse<Application[]>>('/admin/applications'),
};
