import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { storage } from '@/utils/helpers';

let socketInstance: Socket | null = null;

export function initSocket() {
  if (socketInstance) return socketInstance;

  const token = storage.getToken(); // dùng đúng key 'internhub_token'
  if (!token) return null;

  socketInstance = io(process.env.SOCKET_URL || 'http://localhost:3001', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socketInstance.on('connect', () => console.log('[Socket] Connected:', socketInstance?.id));
  socketInstance.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socketInstance.on('connect_error', (err) => console.error('[Socket] Connect error:', err.message));

  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Khởi tạo nếu chưa có, hoặc dùng lại instance đang chạy
    if (!socketInstance || !socketInstance.connected) {
      initSocket();
    }
    socketRef.current = socketInstance;
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    socketInstance?.emit('join_conversation', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    socketInstance?.emit('leave_conversation', { conversationId });
  }, []);

  const sendMessage = useCallback((conversationId: number, content: string) => {
    socketInstance?.emit('send_message', { conversationId, content });
  }, []);

  const sendTyping = useCallback((conversationId: number) => {
    socketInstance?.emit('typing', { conversationId });
  }, []);

  const sendStopTyping = useCallback((conversationId: number) => {
    socketInstance?.emit('stop_typing', { conversationId });
  }, []);

  // Dùng socketInstance (global) để tránh race condition
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketInstance?.on(event, handler);
    return () => { socketInstance?.off(event, handler); };
  }, []);

  return { socket: socketRef.current, joinConversation, leaveConversation, sendMessage, sendTyping, sendStopTyping, on };
}

export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
}