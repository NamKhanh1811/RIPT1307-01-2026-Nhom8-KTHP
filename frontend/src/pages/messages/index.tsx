import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Input, Button, Badge, Empty, Spin, Tooltip, Dropdown, Modal, Drawer, Descriptions, Divider, Tag } from 'antd';
import { SendOutlined, UserOutlined, EditOutlined, DeleteOutlined, MoreOutlined, CheckOutlined, CloseOutlined, MessageOutlined, UserAddOutlined } from '@ant-design/icons';
import { useSearchParams, useModel } from '@umijs/max';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

import { getConversations, startConversation, getMessages, sendMessageRest, editMessage, deleteMessage, getUserProfile } from '@/services/social';
import { useSocket } from '@/hooks/useSocket';
import type { Conversation, Message, UserProfile } from '@/types/social';
import { getAvatarUrl } from '@/utils/helpers';
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

  // ── Edit / Delete state ───────────────────────────────────
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // ── Partner profile drawer ────────────────────────────────
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const openPartnerProfile = async (partnerId: number) => {
    setProfileDrawerOpen(true);
    setProfileLoading(true);
    setSelectedProfile(null);
    try {
      const res = await getUserProfile(partnerId);
      setSelectedProfile(res.data);
    } catch {
      setProfileDrawerOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };
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
      // Cập nhật last_message sidebar cho người gửi (đang trong room)
      setConversations(prev =>
        prev
          .map(c =>
            c.id === msg.conversation_id
              ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
              : c
          )
          .sort((a, b) =>
            new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime()
          )
      );
      scrollToBottom();
    });

    // Cập nhật sidebar cho người NHẬN (chưa join room conv đó nên không nhận được new_message)
    const offConvUpdated = on('conversation_updated', ({ conversationId, preview, lastMessage }: any) => {
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversationId);
        if (!exists) {
          // Conversation mới (lần nhắn đầu tiên) → reload danh sách
          loadConversations();
          return prev;
        }
        return prev
          .map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  last_message: preview,
                  last_message_at: lastMessage?.created_at ?? new Date().toISOString(),
                  unread_count: (c.unread_count ?? 0) + 1,
                }
              : c
          )
          .sort((a, b) =>
            new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime()
          );
      });
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

    // Lắng nghe sự kiện chỉnh sửa / xoá từ socket
    const offEdited = on('message_edited', (updated: any) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    });

    const offDeleted = on('message_deleted', ({ id }: any) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_deleted: true, content: '' } : m));
    });

    return () => {
      offNewMsg?.();
      offConvUpdated?.();
      offTyping?.();
      offStopTyping?.();
      offRead?.();
      offEdited?.();
      offDeleted?.();
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

  // ── Edit message ──────────────────────────────────────────
  const startEdit = (msg: import('@/types/social').Message) => {
    setEditingMsgId(msg.id);
    setEditingContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditingContent('');
  };

  const submitEdit = async (msgId: number) => {
    if (!editingContent.trim()) return;
    try {
      const res = await editMessage(msgId, editingContent.trim());
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...res.data } : m));
      cancelEdit();
    } catch {
      // giữ nguyên state nếu lỗi
    }
  };

  // ── Delete message ────────────────────────────────────────
  const handleDelete = (msgId: number) => {
    Modal.confirm({
      title: 'Xoá tin nhắn?',
      content: 'Tin nhắn sẽ bị xoá với tất cả mọi người.',
      okText: 'Xoá',
      okType: 'danger',
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await deleteMessage(msgId);
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true, content: '' } : m));
        } catch {}
      },
    });
  };

  // ── Gửi tin nhắn ─────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    sendStopTyping(activeConv.id);
    try {
      // Gửi qua REST để đảm bảo lưu DB; backend sẽ emit 'new_message' socket về cho tất cả
      // KHÔNG tự push vào messages ở đây — socket listener 'new_message' sẽ lo việc đó
      // để tránh tin nhắn bị duplicate (hiện 2 lần hoặc hiện số 0)
      await sendMessageRest(activeConv.id, content);
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
      {/* ── Partner Profile Drawer ───────────────────────── */}
      <Drawer
        title="Thông tin người dùng"
        placement="right"
        width={420}
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      >
        <Spin spinning={profileLoading}>
          {selectedProfile && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Avatar size={80} src={getAvatarUrl(selectedProfile.avatar)} icon={<UserOutlined />} />
                <div style={{ marginTop: 10, fontWeight: 700, fontSize: 18 }}>{selectedProfile.full_name}</div>
                {selectedProfile.headline && (
                  <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{selectedProfile.headline}</div>
                )}
                <Tag color={selectedProfile.role === 'EMPLOYER' ? 'blue' : 'green'} style={{ marginTop: 8 }}>
                  {selectedProfile.role === 'EMPLOYER' ? 'Nhà tuyển dụng' : 'Sinh viên'}
                </Tag>
                <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
                  {selectedProfile.connection_count} kết nối
                </div>
              </div>

              {selectedProfile.role === 'EMPLOYER' && selectedProfile.company_name && (
                <>
                  <Divider>Công ty</Divider>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Tên công ty">{selectedProfile.company_name}</Descriptions.Item>
                    {selectedProfile.industry && (
                      <Descriptions.Item label="Ngành">{selectedProfile.industry}</Descriptions.Item>
                    )}
                    {selectedProfile.company_description && (
                      <Descriptions.Item label="Mô tả">{selectedProfile.company_description}</Descriptions.Item>
                    )}
                  </Descriptions>
                </>
              )}

              {selectedProfile.role === 'STUDENT' && (
                <>
                  {selectedProfile.summary && (
                    <>
                      <Divider>Giới thiệu</Divider>
                      <p style={{ fontSize: 13, color: '#444' }}>{selectedProfile.summary}</p>
                    </>
                  )}
                  {(selectedProfile.university || selectedProfile.major) && (
                    <>
                      <Divider>Học vấn</Divider>
                      <Descriptions column={1} size="small">
                        {selectedProfile.university && <Descriptions.Item label="Trường">{selectedProfile.university}</Descriptions.Item>}
                        {selectedProfile.major && <Descriptions.Item label="Ngành">{selectedProfile.major}</Descriptions.Item>}
                        {selectedProfile.graduation_year && <Descriptions.Item label="Năm tốt nghiệp">{selectedProfile.graduation_year}</Descriptions.Item>}
                        {selectedProfile.gpa != null && <Descriptions.Item label="GPA">{selectedProfile.gpa}</Descriptions.Item>}
                      </Descriptions>
                    </>
                  )}
                  {selectedProfile.skills?.length > 0 && (
                    <>
                      <Divider>Kỹ năng</Divider>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedProfile.skills.map(s => <Tag key={s}>{s}</Tag>)}
                      </div>
                    </>
                  )}
                  {selectedProfile.experiences?.length > 0 && (
                    <>
                      <Divider>Kinh nghiệm</Divider>
                      {selectedProfile.experiences.map((exp, idx) => (
                        <div key={idx} style={{ marginBottom: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{exp.position}</div>
                          <div style={{ fontSize: 12, color: '#555' }}>{exp.company}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>
                            {exp.start_date?.slice(0, 7)} — {exp.current ? 'Hiện tại' : exp.end_date?.slice(0, 7)}
                          </div>
                          {exp.description && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{exp.description}</div>}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </Spin>
      </Drawer>
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
                  <Avatar src={getAvatarUrl(conv.partner_avatar)} icon={<UserOutlined />} size={44} />
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
              <Avatar
                src={getAvatarUrl(activeConv.partner_avatar)}
                icon={<UserOutlined />}
                size={38}
                style={{ cursor: 'pointer' }}
                onClick={() => openPartnerProfile(activeConv.partner_id)}
              />
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
                  const isEditing = editingMsgId === msg.id;

                  const menuItems = isMine && !msg.is_deleted ? [
                    { key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined /> },
                    { key: 'delete', label: 'Xoá', icon: <DeleteOutlined />, danger: true },
                  ] : [];

                  return (
                    <div key={msg.id} className={`${styles.msgRow} ${isMine ? styles.mine : styles.theirs}`}>
                      {!isMine && (
                        <div className={styles.msgAvatar}>
                          {showAvatar ? (
                            <Avatar src={getAvatarUrl(msg.sender_avatar)} icon={<UserOutlined />} size={30} />
                          ) : (
                            <div style={{ width: 30 }} />
                          )}
                        </div>
                      )}

                      {/* Actions dropdown — chỉ hiển thị với tin nhắn của mình */}
                      {isMine && !msg.is_deleted && (
                        <Dropdown
                          menu={{
                            items: menuItems,
                            onClick: ({ key }) => {
                              if (key === 'edit') startEdit(msg);
                              if (key === 'delete') handleDelete(msg.id);
                            },
                          }}
                          trigger={['click']}
                          placement="topRight"
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined />}
                            style={{ opacity: 0.5, alignSelf: 'center' }}
                          />
                        </Dropdown>
                      )}

                      {isEditing ? (
                        /* Inline edit mode */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '60%' }}>
                          <Input
                            value={editingContent}
                            onChange={e => setEditingContent(e.target.value)}
                            onPressEnter={() => submitEdit(msg.id)}
                            autoFocus
                            size="small"
                            style={{ borderRadius: 12 }}
                          />
                          <Button
                            type="primary" size="small" shape="circle"
                            icon={<CheckOutlined />}
                            onClick={() => submitEdit(msg.id)}
                          />
                          <Button
                            size="small" shape="circle"
                            icon={<CloseOutlined />}
                            onClick={cancelEdit}
                          />
                        </div>
                      ) : (
                        <Tooltip title={msg.is_deleted ? undefined : formatTime(msg.created_at)} placement={isMine ? 'left' : 'right'}>
                          <div className={styles.bubble} style={!!msg.is_deleted ? { opacity: 0.45, fontStyle: 'italic' } : undefined}>
                            {!!msg.is_deleted
                              ? 'Tin nhắn đã bị xoá'
                              : msg.content}
                            {!!msg.is_edited && !msg.is_deleted && (
                              <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 6 }}>(đã chỉnh sửa)</span>
                            )}
                          </div>
                        </Tooltip>
                      )}
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