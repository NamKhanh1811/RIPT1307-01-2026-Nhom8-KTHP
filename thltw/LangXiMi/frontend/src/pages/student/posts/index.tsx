import {
  Card, Avatar, Button, Input, List, Typography, Space, Divider,
  Modal, Form, message, Popconfirm, Empty, Spin, Tag,
} from 'antd';
import {
  LikeOutlined, LikeFilled, CommentOutlined, DeleteOutlined,
  SendOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useModel } from '@umijs/max';
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

function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
}: {
  post: Post;
  currentUserId?: number;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    setShowComments(true);
    try {
      const res = await postService.getComments(post.id);
      if (res.success) setComments(res.data);
    } catch {
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await postService.createComment({ postId: post.id, content: newComment.trim() });
      if (res.success) {
        setComments((prev) => [...prev, res.data]);
        setNewComment('');
        message.success('Đã bình luận!');
      }
    } catch {
      message.error('Lỗi khi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await postService.deleteComment(post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      message.success('Đã xóa bình luận');
    } catch {
      message.error('Lỗi khi xóa');
    }
  };

  const user = post.user;
  const role = user?.role ?? 'STUDENT';

  return (
    <Card
      style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <Avatar
            size={40}
            style={{ background: ROLE_COLOR[role], fontWeight: 600, flexShrink: 0 }}
          >
            {getInitials(user?.fullName ?? '?')}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.fullName ?? 'Người dùng'}</div>
            <Space size={4}>
              <Tag
                color={ROLE_COLOR[role]}
                style={{ fontSize: 11, padding: '0 6px', lineHeight: '18px', border: 'none' }}
              >
                {ROLE_LABEL[role]}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(post.createdAt)}</Text>
            </Space>
          </div>
        </Space>

        {currentUserId === post.userId && (
          <Popconfirm
            title="Xóa bài đăng này?"
            onConfirm={() => onDelete(post.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        )}
      </div>

      <Paragraph style={{ marginBottom: post.imageUrl ? 12 : 0, whiteSpace: 'pre-wrap' }}>
        {post.content}
      </Paragraph>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="post"
          style={{ width: '100%', borderRadius: 8, maxHeight: 400, objectFit: 'cover', marginBottom: 8 }}
        />
      )}

      <Divider style={{ margin: '10px 0' }} />

      <Space size={16}>
        <Button
          type="text"
          icon={post.isLiked ? <LikeFilled style={{ color: '#185FA5' }} /> : <LikeOutlined />}
          onClick={() => onLike(post.id)}
          style={{ padding: '0 4px', color: post.isLiked ? '#185FA5' : undefined }}
        >
          <span style={{ fontWeight: post.isLiked ? 600 : 400 }}>{post.likesCount} Thích</span>
        </Button>
        <Button
          type="text"
          icon={<CommentOutlined />}
          onClick={loadComments}
          style={{ padding: '0 4px' }}
        >
          {post.commentsCount} Bình luận
        </Button>
      </Space>

      {showComments && (
        <div style={{ marginTop: 12 }}>
          <Divider style={{ margin: '8px 0' }} />

          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>
          ) : (
            <List
              dataSource={comments}
              locale={{ emptyText: 'Chưa có bình luận nào' }}
              renderItem={(c) => (
                <List.Item
                  style={{ padding: '6px 0', borderBottom: 'none' }}
                  actions={
                    currentUserId === c.userId
                      ? [
                          <Popconfirm
                            key="del"
                            title="Xóa bình luận?"
                            onConfirm={() => handleDeleteComment(c.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                          >
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                          </Popconfirm>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={28}
                        style={{ background: ROLE_COLOR[c.user?.role ?? 'STUDENT'], fontSize: 11 }}
                      >
                        {getInitials(c.user?.fullName ?? '?')}
                      </Avatar>
                    }
                    title={
                      <Space size={4}>
                        <Text style={{ fontSize: 13, fontWeight: 600 }}>{c.user?.fullName}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(c.createdAt)}</Text>
                      </Space>
                    }
                    description={<Text style={{ fontSize: 13 }}>{c.content}</Text>}
                  />
                </List.Item>
              )}
            />
          )}

          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              placeholder="Viết bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onPressEnter={handleComment}
              style={{ flex: 1, borderRadius: 20 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleComment}
              loading={submitting}
              disabled={!newComment.trim()}
            />
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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await postService.createPost({ content: content.trim() });
      if (res.success) {
        setPosts((prev) => [{ ...res.data, user, isLiked: false }, ...prev]);
        setContent('');
        setModalOpen(false);
        message.success('Đã đăng bài!');
      }
    } catch {
      message.error('Lỗi khi đăng bài');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await postService.toggleLike(postId);
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: res.data.liked, likesCount: res.data.likesCount }
              : p,
          ),
        );
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
            : p,
        ),
      );
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      message.success('Đã xóa bài đăng');
    } catch {
      message.error('Lỗi khi xóa');
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>📢 Bảng tin cộng đồng</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Đăng bài
        </Button>
      </div>

      <Card
        style={{ marginBottom: 20, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => setModalOpen(true)}
        >
          <Avatar
            size={38}
            style={{ background: ROLE_COLOR[user?.role ?? 'STUDENT'], fontWeight: 600, flexShrink: 0 }}
          >
            {getInitials(user?.fullName ?? '?')}
          </Avatar>
          <div
            style={{
              flex: 1, background: '#f5f5f5', borderRadius: 20,
              padding: '8px 16px', color: '#999', fontSize: 14,
            }}
          >
            Bạn đang nghĩ gì thế, {user?.fullName?.split(' ').pop()}?
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : posts.length === 0 ? (
        <Empty description="Chưa có bài đăng nào. Hãy là người đầu tiên!" />
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onLike={handleLike}
            onDelete={handleDelete}
          />
        ))
      )}

      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setContent(''); }}
        title={
          <Space>
            <Avatar
              size={32}
              style={{ background: ROLE_COLOR[user?.role ?? 'STUDENT'], fontWeight: 600 }}
            >
              {getInitials(user?.fullName ?? '?')}
            </Avatar>
            <span>Tạo bài đăng mới</span>
          </Space>
        }
        footer={[
          <Button key="cancel" onClick={() => { setModalOpen(false); setContent(''); }}>Hủy</Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            disabled={!content.trim()}
            onClick={handleCreate}
            icon={<SendOutlined />}
          >
            Đăng bài
          </Button>,
        ]}
        width={560}
        centered
      >
        <TextArea
          placeholder="Chia sẻ điều gì đó với cộng đồng..."
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ marginTop: 12, borderRadius: 8 }}
          maxLength={1000}
          showCount
        />
      </Modal>
    </div>
  );
}
