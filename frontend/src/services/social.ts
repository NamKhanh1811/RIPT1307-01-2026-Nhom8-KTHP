import request from './request';
import type { NetworkUser, Connection, PendingRequest, Conversation, Message } from '@/types/social';

// ─── Network / Connection ─────────────────────────────────────

export async function getNetworkUsers(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
}) {
  return request.get<never, { success: boolean; data: NetworkUser[] }>('/network/users', { params });
}

export async function getMyConnections(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get<never, { success: boolean; data: Connection[]; total: number }>('/network/connections', { params });
}

export async function getPendingRequests() {
  return request.get<never, { success: boolean; data: PendingRequest[] }>('/network/pending');
}

export async function getSuggestions() {
  return request.get<never, { success: boolean; data: NetworkUser[] }>('/network/suggestions');
}

export async function sendConnectionRequest(userId: number) {
  return request.post<never, { success: boolean; message: string }>(`/network/connect/${userId}`);
}

export async function acceptRequest(connectionId: number) {
  return request.patch(`/network/connections/${connectionId}/accept`);
}

export async function rejectRequest(connectionId: number) {
  return request.patch(`/network/connections/${connectionId}/reject`);
}

export async function removeConnection(connectionId: number) {
  return request.delete(`/network/connections/${connectionId}`);
}

// ─── Messages ─────────────────────────────────────────────────

export async function getConversations() {
  return request.get<never, { success: boolean; data: Conversation[] }>('/messages/conversations');
}

export async function startConversation(partnerId: number) {
  return request.post<never, { success: boolean; data: { id: number } }>(
    `/messages/conversations/${partnerId}/start`
  );
}

export async function getMessages(conversationId: number, params?: { page?: number }) {
  return request.get<never, { success: boolean; data: Message[] }>(
    `/messages/conversations/${conversationId}`,
    { params }
  );
}

export async function sendMessageRest(conversationId: number, content: string) {
  return request.post<never, { success: boolean; data: Message }>(
    `/messages/conversations/${conversationId}/send`,
    { content }
  );
}

export async function getUnreadCount() {
  return request.get<never, { success: boolean; data: { total: number } }>('/messages/unread-count');
}

export async function editMessage(msgId: number, content: string) {
  return request.patch<never, { success: boolean; data: import('@/types/social').Message }>(
    `/messages/${msgId}`,
    { content }
  );
}

export async function deleteMessage(msgId: number) {
  return request.delete<never, { success: boolean }>(`/messages/${msgId}`);
}

export async function getUserProfile(userId: number) {
  return request.get<never, { success: boolean; data: import('@/types/social').UserProfile }>(
    `/network/users/${userId}/profile`
  );
}