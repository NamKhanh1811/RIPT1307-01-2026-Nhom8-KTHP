import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Input, Button, Badge, Empty, Spin, Tooltip } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { useSearchParams, useModel } from '@umijs/max';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

import { getConversations, startConversation, getMessages, sendMessageRest } from '@/services/social';
import { useSocket } from '@/hooks/useSocket';
import type { Conversation, Message } from '@/types/social';
import styles from './index.less';

const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Fix 1: lấy currentUserId từ initialState thay vì localStorage sai key
  const { initialState } = useModel('@@initialState');
  const currentUserId = initialState?.currentUser?.id ?? 0;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();
  const { joinConversation, leaveConversation, sendTyping, sendStopTyping, on } = useSocket();

  // ── Load conversation list ────────────────────────────────
  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await getConversations();
      setConversations(res.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // ── Auto-open nếu có partnerId từ URL ─────────────────────
  useEffect(() => {
    const partnerId = searchParams.get('partnerId');
    if (partnerId) {
      handleStartConversation(+partnerId);
    }
  }, [searchParams]);

  // ── Socket events ─────────────────────────────────────────
  useEffect(() => {
    const offNewMsg = on('new_message', (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations(prev =>
        prev.map(c =>
          c.id === msg.conversation_id
            ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
            : c
        )
      );
      scrollToBottom();
    });

    const offTyping = on('user_typing', ({ userName }: any) => {
      setTypingUser(userName);
      setIsTyping(true);
    });

    const offStopTyping = on('user_stop_typing', () => {
      setIsTyping(false);
    });

    const offRead = on('messages_read', ({ conversationId }: any) => {
      if (activeConv?.id === conversationId) {
        setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      }
    });

    return () => {
      offNewMsg?.();
      offTyping?.();
      offStopTyping?.();
      offRead?.();
    };
  }, [on, activeConv]);

  // ── Mở conversation ───────────────────────────────────────
  const openConversation = async (conv: Conversation) => {
    if (activeConv) leaveConversation(activeConv.id);
    setActiveConv(conv);
    setMsgLoading(true);
    try {
      const res = await getMessages(conv.id);
      setMessages(res.data ?? []);
      joinConversation(conv.id);
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      );
      setTimeout(scrollToBottom, 100);
    } finally { setMsgLoading(false); }
  };

  const handleStartConversation = async (partnerId: number) => {
    try {
      await startConversation(partnerId);
      const convs = await getConversations();
      setConversations(convs.data ?? []);
      const target = (convs.data ?? []).find((c: Conversation) => c.partner_id === partnerId);
      if (target) openConversation(target);
    } catch {}
  };

  // ── Gửi tin nhắn ─────────────────────────────────────────
  // Fix 2: dùng REST API thay vì chỉ socket — đảm bảo tin nhắn luôn được lưu và hiển thị
  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    sendStopTyping(activeConv.id);
    try {
      const res = await sendMessageRest(activeConv.id, content);
      const msg = res.data;
      // Thêm tin nhắn vào UI ngay lập tức
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Cập nhật last_message trong sidebar
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConv.id
            ? { ...c, last_message: content, last_message_at: msg.created_at }
            : c
        )
      );
      scrollToBottom();
    } catch {
      setInput(content); // khôi phục input nếu lỗi
    } finally {
      setSending(false);
    }
  }, [input, activeConv, sending, sendStopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!activeConv) return;
    sendTyping(activeConv.id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendStopTyping(activeConv.id), 2000);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const formatTime = (t: string) => dayjs(t).format('HH:mm');
  const formatDate = (t: string) => {
    const d = dayjs(t);
    if (d.isToday()) return d.format('HH:mm');
    if (d.isYesterday()) return 'Hôm qua';
    return d.format('DD/MM');
  };

  return (
    <div className={styles.page}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Tin nhắn</h2>
        </div>
        <Spin spinning={loading}>
          {conversations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có tin nhắn"
              style={{ marginTop: 40 }}
            />
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`${styles.convItem} ${activeConv?.id === conv.id ? styles.convActive : ''}`}
                onClick={() => openConversation(conv)}
              >
                <Badge count={conv.unread_count} size="small">
                  <Avatar src={conv.partner_avatar} icon={<UserOutlined />} size={44} />
                </Badge>
                <div className={styles.convInfo}>
                  <div className={styles.convName}>{conv.partner_name}</div>
                  <div className={styles.convLast}>
                    {conv.last_message || 'Bắt đầu cuộc trò chuyện'}
                  </div>
                </div>
                {conv.last_message_at && (
                  <div className={styles.convTime}>{formatDate(conv.last_message_at)}</div>
                )}
              </div>
            ))
          )}
        </Spin>
      </div>

      {/* ── Chat area ───────────────────────────────────── */}
      <div className={styles.chatArea}>
        {!activeConv ? (
          <div className={styles.emptyChat}>
            <Empty description="Chọn một cuộc trò chuyện để bắt đầu" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <Avatar src={activeConv.partner_avatar} icon={<UserOutlined />} size={38} />
              <div className={styles.chatPartnerInfo}>
                <span className={styles.chatPartnerName}>{activeConv.partner_name}</span>
                {isTyping && <span className={styles.typingHint}>{typingUser} đang gõ...</span>}
              </div>
            </div>

            {/* Messages */}
            <div className={styles.msgList}>
              <Spin spinning={msgLoading}>
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === currentUserId;
                  const showAvatar = !isMine && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);
                  return (
                    <div key={msg.id} className={`${styles.msgRow} ${isMine ? styles.mine : styles.theirs}`}>
                      {!isMine && (
                        <div className={styles.msgAvatar}>
                          {showAvatar ? (
                            <Avatar src={msg.sender_avatar} icon={<UserOutlined />} size={30} />
                          ) : (
                            <div style={{ width: 30 }} />
                          )}
                        </div>
                      )}
                      <Tooltip title={formatTime(msg.created_at)} placement={isMine ? 'left' : 'right'}>
                        <div className={styles.bubble}>{msg.content}</div>
                      </Tooltip>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </Spin>
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
              <Input.TextArea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn... (Enter để gửi)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                className={styles.textInput}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sending}
                disabled={!input.trim()}
                className={styles.sendBtn}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;