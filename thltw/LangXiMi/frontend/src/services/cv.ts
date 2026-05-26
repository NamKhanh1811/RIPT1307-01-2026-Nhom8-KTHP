import request from './request';
import type { ApiResponse, CvProfile } from '@/types';

export const cvService = {
  getMyCv: () =>
    request.get<never, ApiResponse<CvProfile>>('/cv/my'),

  saveCv: (data: Partial<CvProfile>) =>
    request.post<never, ApiResponse<CvProfile>>('/cv', data),

  updateCv: (data: Partial<CvProfile>) =>
    request.put<never, ApiResponse<CvProfile>>('/cv/my', data),

  uploadPdf: (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);
    return request.post<never, ApiResponse<{ url: string }>>('/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getCvByUserId: (userId: number) =>
    request.get<never, ApiResponse<CvProfile>>(`/cv/user/${userId}`),
};
