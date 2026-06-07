import { Avatar, Card, Tag, Typography, Button, Divider, Space, Skeleton } from 'antd';
import {
  UserOutlined, MailOutlined, BookOutlined, EditOutlined,
  BankOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import { getInitials, getAvatarUrl } from '@/utils/helpers';

const { Text, Title } = Typography;

const ROLE_COLOR: Record<string, string> = {
  STUDENT: '#185FA5', EMPLOYER: '#0F6E56', ADMIN: '#993C1D',
};
const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Sinh viên', EMPLOYER: 'Doanh nghiệp', ADMIN: 'Quản trị viên',
};
const ROLE_ICON: Record<string, React.ReactNode> = {
  STUDENT: <BookOutlined />,
  EMPLOYER: <BankOutlined />,
  ADMIN: <SafetyOutlined />,
};

const ROLE_LINKS: Record<string, { label: string; path: string; icon: React.ReactNode }[]> = {
  STUDENT: [
    { label: 'Preferences', path: '/student/cv', icon: <EditOutlined /> },
    { label: 'Job tracker', path: '/student/applications', icon: <BookOutlined /> },
    { label: 'Post a free job', path: '/student/posts', icon: <UserOutlined /> },
  ],
  EMPLOYER: [
    { label: 'Quản lý tin', path: '/employer/jobs', icon: <BankOutlined /> },
    { label: 'Ứng viên', path: '/employer/candidates', icon: <UserOutlined /> },
  ],
  ADMIN: [
    { label: 'Quản lý user', path: '/admin/users', icon: <UserOutlined /> },
    { label: 'Duyệt tin', path: '/admin/jobs', icon: <SafetyOutlined /> },
  ],
};

export default function UserProfileCard() {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;

  if (!user) {
    return (
      <Card style={cardStyle}>
        <Skeleton avatar active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  const role = user.role ?? 'STUDENT';
  const links = ROLE_LINKS[role] ?? [];

  return (
    <Card style={cardStyle} styles={{ body: { padding: 0 } }}>
      <div
        style={{
          height: 64,
          background: `linear-gradient(135deg, ${ROLE_COLOR[role]}cc 0%, ${ROLE_COLOR[role]}44 100%)`,
          borderRadius: '8px 8px 0 0',
        }}
      />

      <div style={{ padding: '0 16px', marginTop: -24, marginBottom: 12 }}>
        <Avatar
          size={52}
          src={getAvatarUrl(user.avatar)}
          style={{
            background: ROLE_COLOR[role],
            fontWeight: 700,
            fontSize: 18,
            border: '3px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {!user.avatar && getInitials(user.fullName)}
        </Avatar>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {/* Name & role */}
        <Title level={5} style={{ margin: '0 0 2px', fontSize: 15 }}>{user.fullName}</Title>
        <Tag
          icon={ROLE_ICON[role]}
          color={ROLE_COLOR[role]}
          style={{ border: 'none', marginBottom: 8, fontSize: 11 }}
        >
          {ROLE_LABEL[role]}
        </Tag>

        <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 12 }}>
          <Space size={6}>
            <MailOutlined style={{ color: '#888', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis title={user.email}>
              {user.email}
            </Text>
          </Space>
          {role === 'STUDENT' && (
            <Space size={6}>
              <BookOutlined style={{ color: '#888', fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{(user as any).university || 'Sinh viên'}</Text>
            </Space>
          )}
        </Space>

        <Divider style={{ margin: '8px 0' }} />

        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          {links.map((link) => (
            <Button
              key={link.path}
              type="text"
              icon={link.icon}
              onClick={() => history.push(link.path)}
              style={{
                width: '100%',
                textAlign: 'left',
                paddingLeft: 4,
                color: '#555',
                fontSize: 13,
                height: 32,
              }}
            >
              {link.label}
            </Button>
          ))}
        </Space>

        <Divider style={{ margin: '8px 0' }} />

        {role === 'STUDENT' && (
          <Button
            type="default"
            icon={<EditOutlined />}
            block
            onClick={() => history.push('/student/posts')}
            style={{ borderColor: ROLE_COLOR[role], color: ROLE_COLOR[role], fontSize: 13 }}
          >
            Post a free job
          </Button>
        )}
      </div>
    </Card>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: 10,
  boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
  overflow: 'hidden',
  width: 220,
};