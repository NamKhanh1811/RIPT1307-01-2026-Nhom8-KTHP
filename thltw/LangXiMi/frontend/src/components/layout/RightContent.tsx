import { useModel, history } from '@umijs/max';
import { Avatar, Dropdown, Space, Badge, List, Popover, Typography, Button, Modal, Tag, Grid, Drawer } from 'antd';
import { LogoutOutlined, BellOutlined, BellFilled, MenuOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { storage, getInitials } from '@/utils/helpers';
import { notificationService } from '@/services/notifications';
import type { MenuProps } from 'antd';
import type { Notification } from '@/types';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Sinh viên', EMPLOYER: 'Doanh nghiệp', ADMIN: 'Quản trị viên',
};
const ROLE_COLOR: Record<string, string> = {
  STUDENT: '#185FA5', EMPLOYER: '#0F6E56', ADMIN: '#993C1D',
};

const NOTI_COLOR: Record<string, string> = {
  APPLY_SUCCESS:        '#6366f1',
  APPLICATION_APPROVED: '#22c55e',
  APPLICATION_REJECTED: '#ef4444',
  NEW_APPLICATION:      '#f59e0b',
  JOB_APPROVED:         '#22c55e',
  JOB_REJECTED:         '#ef4444',
};
const NOTI_LABEL: Record<string, string> = {
  APPLY_SUCCESS:        'Ứng tuyển',
  APPLICATION_APPROVED: 'Được duyệt',
  APPLICATION_REJECTED: 'Bị từ chối',
  NEW_APPLICATION:      'Ứng viên mới',
  JOB_APPROVED:         'Tin được duyệt',
  JOB_REJECTED:         'Tin bị từ chối',
};

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [modalOpen, setModalOpen]         = useState(false);
  const [popoverOpen, setPopoverOpen]     = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    notificationService.getMyNotifications()
      .then((res) => { if (res.success) setNotifications(res.data); })
      .catch(() => {});
  }, []);

  const markAllRead = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setPopoverOpen(false);
    setModalOpen(true);
  };

  const popoverContent = (
    <div style={{ width: isMobile ? 'calc(100vw - 32px)' : 320, maxWidth: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>
          Thông báo{unread > 0 && <Tag color="blue" style={{ marginLeft: 6 }}>{unread} chưa đọc</Tag>}
        </Text>
        {notifications.length > 0 && (
          <Button size="small" type="link" onClick={markAllRead}>Xem tất cả</Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 16 }}>
          Chưa có thông báo
        </Text>
      ) : (
        <List
          dataSource={notifications.slice(0, 5)}
          renderItem={(item) => (
            <List.Item style={{ padding: '8px 0', opacity: item.isRead ? 0.6 : 1 }}>
              <List.Item.Meta
                title={<Text style={{ fontSize: 13 }}>{item.title}</Text>}
                description={<Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>}
              />
              {!item.isRead && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
              )}
            </List.Item>
          )}
        />
      )}
      {notifications.length > 5 && (
        <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Button type="link" size="small" onClick={markAllRead}>
            Xem thêm {notifications.length - 5} thông báo
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Popover
        content={popoverContent}
        trigger="click"
        placement="bottomRight"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        overlayStyle={isMobile ? {
          maxWidth: 'calc(100vw - 16px)',
          right: 8,
        } : undefined}
        overlayInnerStyle={isMobile ? { padding: '12px' } : undefined}
      >
        <Badge count={unread} size="small" style={{ cursor: 'pointer' }}>
          {unread > 0
            ? <BellFilled style={{ fontSize: 18, cursor: 'pointer', color: '#6366f1' }} />
            : <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          }
        </Badge>
      </Popover>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={<Button type="primary" onClick={() => setModalOpen(false)}>Đóng</Button>}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellFilled style={{ color: '#6366f1' }} />
            <span>Tất cả thông báo</span>
            <Tag color="blue">{notifications.length}</Tag>
          </div>
        }
        width={isMobile ? '95vw' : 560}
        style={isMobile ? { top: 10 } : undefined}
        centered={!isMobile}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto', padding: '8px 0' } }}
      >
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <BellOutlined style={{ fontSize: 40, color: '#64748b', marginBottom: 12 }} />
            <div style={{ color: '#64748b' }}>Chưa có thông báo nào</div>
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  background: item.isRead ? 'transparent' : 'rgba(99,102,241,0.06)',
                  borderLeft: item.isRead ? '3px solid transparent' : '3px solid #6366f1',
                  marginBottom: 2,
                }}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: item.isRead ? 400 : 600 }}>
                        {item.title}
                      </Text>
                      {item.type && NOTI_LABEL[item.type] && (
                        <Tag color={NOTI_COLOR[item.type] ?? 'default'} style={{ fontSize: 11 }}>
                          {NOTI_LABEL[item.type]}
                        </Tag>
                      )}
                      {!item.isRead && <Tag color="blue" style={{ fontSize: 11 }}>Mới</Tag>}
                    </div>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>{item.message}</Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
}

export function rightContentRender() {
  const { initialState, setInitialState } = useModel('@@initialState');
  const user = initialState?.currentUser;
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
    <Space size={isMobile ? 12 : 20} style={{ paddingRight: isMobile ? 12 : 24 }}>
      <NotificationBell />
      <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
        <Space style={{ cursor: 'pointer' }} size={isMobile ? 6 : 8}>
          <Avatar
            size={isMobile ? 28 : 32}
            style={{ background: ROLE_COLOR[user.role] || '#185FA5', fontWeight: 500 }}
          >
            {getInitials(user.fullName)}
          </Avatar>
          {!isMobile && (
            <span style={{ fontWeight: 500 }}>{user.fullName}</span>
          )}
        </Space>
      </Dropdown>
    </Space>
  );
}