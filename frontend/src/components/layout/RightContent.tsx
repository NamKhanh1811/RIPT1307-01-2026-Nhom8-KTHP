import { useModel, history } from '@umijs/max';
import { Avatar, Dropdown, Space, Badge, List, Popover, Typography, Button } from 'antd';
import { LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { storage, getInitials } from '@/utils/helpers';
import { notificationService } from '@/services/notifications';
import type { MenuProps } from 'antd';
import type { Notification } from '@/types';

const { Text } = Typography;

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Sinh viên', EMPLOYER: 'Doanh nghiệp', ADMIN: 'Quản trị viên',
};
const ROLE_COLOR: Record<string, string> = {
  STUDENT: '#185FA5', EMPLOYER: '#0F6E56', ADMIN: '#993C1D',
};

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    notificationService.getMyNotifications()
      .then((res) => { if (res.success) setNotifications(res.data); })
      .catch(() => {});
  }, []);

  const markAllRead = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const content = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>Thông báo</Text>
        {unread > 0 && <Button size="small" type="link" onClick={markAllRead}>Đọc tất cả</Button>}
      </div>
      {notifications.length === 0 ? (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 16 }}>
          Chưa có thông báo
        </Text>
      ) : (
        <List dataSource={notifications.slice(0, 8)} renderItem={(item) => (
          <List.Item style={{ padding: '8px 0', opacity: item.isRead ? 0.6 : 1 }}>
            <List.Item.Meta
              title={<Text style={{ fontSize: 13 }}>{item.title}</Text>}
              description={<Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>}
            />
            {!item.isRead && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#185FA5', flexShrink: 0 }} />
            )}
          </List.Item>
        )} />
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <Badge count={unread} size="small" style={{ cursor: 'pointer' }}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
}

export function rightContentRender() {
  const { initialState, setInitialState } = useModel('@@initialState');
  const user = initialState?.currentUser;

  const logout = () => {
    storage.clear();
    setInitialState((s: any) => ({ ...s, currentUser: null, token: null }));
    history.push('/login');
  };

  if (!user) return null;

  const menuItems: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 500 }}>{user.fullName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
          <div style={{ fontSize: 12, color: ROLE_COLOR[user.role] }}>{ROLE_LABEL[user.role]}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout },
  ];

  return (
    <Space size={20} style={{ paddingRight: 24 }}>
      <NotificationBell />
      <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar style={{ background: ROLE_COLOR[user.role] || '#185FA5', fontWeight: 500 }}>
            {getInitials(user.fullName)}
          </Avatar>
          <span style={{ fontWeight: 500 }}>{user.fullName}</span>
        </Space>
      </Dropdown>
    </Space>
  );
}
