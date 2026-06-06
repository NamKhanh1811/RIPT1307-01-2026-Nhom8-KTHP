import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@umijs/max';

let socketInstance: Socket | null = null;


export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      const token = getAccessToken?.() || localStorage.getItem('token');
      socketInstance = io(process.env.SOCKET_URL || 'http://localhost:3001', {
        auth: { token },
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => console.log('[Socket] Connected'));
      socketInstance.on('disconnect', () => console.log('[Socket] Disconnected'));
      socketInstance.on('error', (err: any) => console.error('[Socket] Error:', err));
    }
    socketRef.current = socketInstance;

    return () => {
    };
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('join_conversation', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('leave_conversation', { conversationId });
  }, []);

  const sendMessage = useCallback((conversationId: number, content: string) => {
    socketRef.current?.emit('send_message', { conversationId, content });
  }, []);

  const sendTyping = useCallback((conversationId: number) => {
    socketRef.current?.emit('typing', { conversationId });
  }, []);

  const sendStopTyping = useCallback((conversationId: number) => {
    socketRef.current?.emit('stop_typing', { conversationId });
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, joinConversation, leaveConversation, sendMessage, sendTyping, sendStopTyping, on };
}


export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
}
