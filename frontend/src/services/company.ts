import request from './request';
import type { ApiResponse, Company } from '@/types';

export const companyService = {
  getMyCompany: () =>
    request.get<never, ApiResponse<Company>>('/company/my'),

  updateCompany: (data: Partial<Company>) =>
    request.put<never, ApiResponse<Company>>('/company/my', data),
};
