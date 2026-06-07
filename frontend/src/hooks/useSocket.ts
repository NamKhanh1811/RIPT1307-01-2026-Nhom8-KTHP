import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { storage } from '@/utils/helpers';

let socketInstance: Socket | null = null;

// Queue các listener đăng ký trước khi socket sẵn sàng
const pendingListeners: Array<{ event: string; handler: (...args: any[]) => void }> = [];

export function initSocket() {
  if (socketInstance) return socketInstance;

  const token = storage.getToken();
  if (!token) return null;

  socketInstance = io(process.env.SOCKET_URL || 'http://localhost:3001', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected:', socketInstance?.id);
    // Đăng ký lại tất cả listener đang chờ
    pendingListeners.forEach(({ event, handler }) => {
      socketInstance?.on(event, handler);
    });
    pendingListeners.length = 0;
  });

  socketInstance.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socketInstance.on('connect_error', (err) => console.error('[Socket] Connect error:', err.message));

  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
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

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketInstance?.connected) {
      // Socket đã sẵn sàng → đăng ký ngay
      socketInstance.on(event, handler);
    } else if (socketInstance) {
      // Socket tồn tại nhưng chưa connect → đợi connect rồi đăng ký
      socketInstance.once('connect', () => {
        socketInstance?.on(event, handler);
      });
    } else {
      // Socket chưa khởi tạo → đẩy vào queue
      pendingListeners.push({ event, handler });
    }

    return () => {
      socketInstance?.off(event, handler);
      // Xoá khỏi queue nếu chưa kịp đăng ký
      const idx = pendingListeners.findIndex(p => p.event === event && p.handler === handler);
      if (idx !== -1) pendingListeners.splice(idx, 1);
    };
  }, []);

  return { socket: socketRef.current, joinConversation, leaveConversation, sendMessage, sendTyping, sendStopTyping, on };
}

export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
  pendingListeners.length = 0;
}