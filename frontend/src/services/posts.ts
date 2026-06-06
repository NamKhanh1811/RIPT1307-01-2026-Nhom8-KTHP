import request from './request';
import type { ApiResponse, Post, Comment, CreatePostPayload, CreateCommentPayload } from '@/types';

export const postService = {
  getPosts: (params?: { page?: number; pageSize?: number }) =>
    request.get<never, ApiResponse<Post[]>>('/posts', { params }),

  createPost: (payload: CreatePostPayload) =>
    request.post<never, ApiResponse<Post>>('/posts', payload),

  deletePost: (id: number) =>
    request.delete<never, ApiResponse<null>>(`/posts/${id}`),

  toggleLike: (postId: number) =>
    request.post<never, ApiResponse<{ liked: boolean; likesCount: number }>>(`/posts/${postId}/like`),

  getComments: (postId: number) =>
    request.get<never, ApiResponse<Comment[]>>(`/posts/${postId}/comments`),

  createComment: (payload: CreateCommentPayload) =>
    request.post<never, ApiResponse<Comment>>(`/posts/${payload.postId}/comments`, {
      content: payload.content,
    }),

  deleteComment: (postId: number, commentId: number) =>
    request.delete<never, ApiResponse<null>>(`/posts/${postId}/comments/${commentId}`),
};