import {
  Card, Avatar, Button, Input, List, Typography, Space, Divider,
  Modal, message, Popconfirm, Empty, Spin, Tag,
} from 'antd';
import {
  LikeOutlined, LikeFilled, CommentOutlined, DeleteOutlined,
  SendOutlined, PlusOutlined, MailOutlined, BookOutlined,
  EditOutlined, BankOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import { useEffect, useState } from 'react';
import { postService } from '@/services/posts';
import { getInitials, formatDate } from '@/utils/helpers';
import type { Post, Comment } from '@/types';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

const ROLE_COLOR: Record<string, string> = {
  STUDENT: '#185FA5', EMPLOYER: '#0F6E56', ADMIN: '#993C1D',
};
const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Sinh viên', EMPLOYER: 'Doanh nghiệp', ADMIN: 'Quản trị viên',
};
const ROLE_LINKS: Record<string, { label: string; path: string; icon: React.ReactNode }[]> = {
  STUDENT: [
    { label: 'Preferences', path: '/student/cv', icon: <EditOutlined /> },
    { label: 'Job tracker', path: '/student/applications', icon: <BookOutlined /> },
    { label: 'Post a free job', path: '/student/posts', icon: <PlusOutlined /> },
  ],
  EMPLOYER: [
    { label: 'Quản lý tin', path: '/employer/jobs', icon: <BankOutlined /> },
    { label: 'Ứng viên', path: '/employer/candidates', icon: <EditOutlined /> },
  ],
  ADMIN: [
    { label: 'Quản lý user', path: '/admin/users', icon: <EditOutlined /> },
    { label: 'Duyệt tin', path: '/admin/jobs', icon: <SafetyOutlined /> },
  ],
};

// ---------- Profile Sidebar ----------
function ProfileSidebar({ user }: { user: any }) {
  if (!user) return null;
  const role = user.role ?? 'STUDENT';
  const links = ROLE_LINKS[role] ?? [];

  return (
    <Card
      style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.09)', position: 'sticky', top: 16 }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{
        height: 80,
        background: `linear-gradient(135deg, ${ROLE_COLOR[role]}dd 0%, ${ROLE_COLOR[role]}44 100%)`,
      }} />
      <div style={{ padding: '0 20px', marginTop: -30, marginBottom: 12 }}>
        <Avatar size={60} style={{
          background: ROLE_COLOR[role], fontWeight: 700, fontSize: 22,
          border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        }}>
          {getInitials(user.fullName)}
        </Avatar>
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{user.fullName}</div>
        <Tag color={ROLE_COLOR[role]} style={{ border: 'none', fontSize: 12, marginBottom: 12 }}>
          {ROLE_LABEL[role]}
        </Tag>

        <Space direction="vertical" size={6} style={{ width: '100%', marginBottom: 12 }}>
          <Space size={8}>
            <MailOutlined style={{ color: '#aaa', fontSize: 13 }} />
            <Text type="secondary" style={{ fontSize: 13 }} ellipsis>{user.email}</Text>
          </Space>
          {role === 'STUDENT' && (
            <Space size={8}>
              <BookOutlined style={{ color: '#aaa', fontSize: 13 }} />
              <Text type="secondary" style={{ fontSize: 13 }}>Sinh viên PTIT</Text>
            </Space>
          )}
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          {links.map((link) => (
            <Button key={link.path} type="text" icon={link.icon}
              onClick={() => history.push(link.path)}
              style={{ width: '100%', textAlign: 'left', paddingLeft: 8, color: '#444', fontSize: 14, height: 38 }}>
              {link.label}
            </Button>
          ))}
        </Space>

        {role === 'STUDENT' && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Button type="primary" ghost icon={<PlusOutlined />} block
              onClick={() => history.push('/student/posts')}
              style={{ fontSize: 14, borderColor: ROLE_COLOR[role], color: ROLE_COLOR[role] }}>
              Post a free job
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

// ---------- PostCard ----------
function PostCard({ post, currentUserId, onLike, onDelete }: {
  post: Post; currentUserId?: number;
  onLike: (id: number) => void; onDelete: (id: number) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true); setShowComments(true);
    try {
      const res = await postService.getComments(post.id);
      if (res.success) setComments(res.data);
    } catch { } finally { setLoadingComments(false); }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await postService.createComment({ postId: post.id, content: newComment.trim() });
      if (res.success) { setComments((p) => [...p, res.data]); setNewComment(''); message.success('Đã bình luận!'); }
    } catch { message.error('Lỗi'); } finally { setSubmitting(false); }
  };

  const role = post.user?.role ?? 'STUDENT';

  return (
    <Card style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
      styles={{ body: { padding: '20px 24px' } }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Space>
          <Avatar size={44} style={{ background: ROLE_COLOR[role], fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
            {getInitials(post.user?.fullName ?? '?')}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{post.user?.fullName ?? 'Người dùng'}</div>
            <Space size={6}>
              <Tag color={ROLE_COLOR[role]} style={{ fontSize: 11, padding: '0 6px', lineHeight: '18px', border: 'none' }}>
                {ROLE_LABEL[role]}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(post.createdAt)}</Text>
            </Space>
          </div>
        </Space>
        {currentUserId === post.userId && (
          <Popconfirm title="Xóa bài đăng?" onConfirm={() => onDelete(post.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </div>

      <Paragraph style={{ fontSize: 15, marginBottom: post.imageUrl ? 14 : 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
        {post.content}
      </Paragraph>

      {post.imageUrl && (
        <img src={post.imageUrl} alt="post"
          style={{ width: '100%', borderRadius: 10, maxHeight: 400, objectFit: 'cover', marginBottom: 10 }} />
      )}

      <Divider style={{ margin: '12px 0' }} />

      <Space size={20}>
        <Button type="text" icon={post.isLiked ? <LikeFilled style={{ color: '#185FA5' }} /> : <LikeOutlined />}
          onClick={() => onLike(post.id)}
          style={{ color: post.isLiked ? '#185FA5' : '#666', fontWeight: post.isLiked ? 600 : 400, padding: '0 4px' }}>
          {post.likesCount} Thích
        </Button>
        <Button type="text" icon={<CommentOutlined />} onClick={loadComments}
          style={{ color: '#666', padding: '0 4px' }}>
          {post.commentsCount} Bình luận
        </Button>
      </Space>

      {showComments && (
        <div style={{ marginTop: 14 }}>
          <Divider style={{ margin: '8px 0' }} />
          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>
          ) : (
            <List dataSource={comments} locale={{ emptyText: 'Chưa có bình luận' }}
              renderItem={(c) => (
                <List.Item style={{ padding: '8px 0', borderBottom: 'none' }}
                  actions={currentUserId === c.userId ? [
                    <Popconfirm key="del" title="Xóa?" onConfirm={async () => {
                      await postService.deleteComment(post.id, c.id);
                      setComments((p) => p.filter((x) => x.id !== c.id));
                    }} okText="Xóa" cancelText="Hủy">
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  ] : []}>
                  <List.Item.Meta
                    avatar={<Avatar size={30} style={{ background: ROLE_COLOR[c.user?.role ?? 'STUDENT'], fontSize: 11 }}>
                      {getInitials(c.user?.fullName ?? '?')}
                    </Avatar>}
                    title={<Space size={6}>
                      <Text style={{ fontSize: 13, fontWeight: 600 }}>{c.user?.fullName}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(c.createdAt)}</Text>
                    </Space>}
                    description={<Text style={{ fontSize: 13 }}>{c.content}</Text>}
                  />
                </List.Item>
              )} />
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Input placeholder="Viết bình luận..." value={newComment}
              onChange={(e) => setNewComment(e.target.value)} onPressEnter={handleComment}
              style={{ flex: 1, borderRadius: 20 }} />
            <Button type="primary" icon={<SendOutlined />} onClick={handleComment}
              loading={submitting} disabled={!newComment.trim()} />
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------- Main Page ----------
export default function PostsPage() {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await postService.getPosts({ page: 1, pageSize: 20 });
      if (res.success) setPosts(res.data);
    } catch { } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await postService.createPost({ content: content.trim() });
      if (res.success) {
        setPosts((p) => [{ ...res.data, user, isLiked: false }, ...p]);
        setContent(''); setModalOpen(false); message.success('Đã đăng bài!');
      }
    } catch { message.error('Lỗi khi đăng bài'); } finally { setSubmitting(false); }
  };

  const handleLike = async (postId: number) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 } : p
    ));
    try {
      const res = await postService.toggleLike(postId);
      if (res.success) setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, isLiked: res.data.liked, likesCount: res.data.likesCount } : p
      ));
    } catch { }
  };

  const handleDelete = async (postId: number) => {
    try {
      await postService.deletePost(postId);
      setPosts((p) => p.filter((x) => x.id !== postId));
      message.success('Đã xóa');
    } catch { message.error('Lỗi khi xóa'); }
  };

  return (
    // Dùng style full width, flex layout
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', width: '100%' }}>
      
      {/* Cột trái - Feed (co giãn full) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>📢 Bảng tin cộng đồng</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Đăng bài
          </Button>
        </div>

        {/* Quick post */}
        <Card
          style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}
          styles={{ body: { padding: '14px 20px' } }}
          onClick={() => setModalOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} style={{ background: ROLE_COLOR[user?.role ?? 'STUDENT'], fontWeight: 600, flexShrink: 0 }}>
              {getInitials(user?.fullName ?? '?')}
            </Avatar>
            <div style={{
              flex: 1, background: '#f5f5f5', borderRadius: 20,
              padding: '10px 18px', color: '#aaa', fontSize: 14,
            }}>
              Bạn đang nghĩ gì thế, {user?.fullName?.split(' ').pop()}?
            </div>
          </div>
        </Card>

        {/* Posts */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
        ) : posts.length === 0 ? (
          <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
            <Empty description="Chưa có bài đăng nào. Hãy là người đầu tiên!" />
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id}
              onLike={handleLike} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Cột phải - Profile card (fixed width 280px) */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <ProfileSidebar user={user} />
      </div>

      {/* Modal tạo bài */}
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setContent(''); }}
        title={
          <Space>
            <Avatar size={32} style={{ background: ROLE_COLOR[user?.role ?? 'STUDENT'], fontWeight: 600 }}>
              {getInitials(user?.fullName ?? '?')}
            </Avatar>
            <span>Tạo bài đăng mới</span>
          </Space>
        }
        footer={[
          <Button key="cancel" onClick={() => { setModalOpen(false); setContent(''); }}>Hủy</Button>,
          <Button key="submit" type="primary" loading={submitting} disabled={!content.trim()}
            onClick={handleCreate} icon={<SendOutlined />}>Đăng bài</Button>,
        ]}
        width={540} centered
      >
        <TextArea placeholder="Chia sẻ điều gì đó với cộng đồng..."
          rows={5} value={content} onChange={(e) => setContent(e.target.value)}
          style={{ marginTop: 12, borderRadius: 8 }} maxLength={1000} showCount />
      </Modal>
    </div>
  );
}
