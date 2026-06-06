import React, { useState, useEffect } from 'react';
import {
  Tabs, Input, Button, Avatar, Card, Badge, Empty, Spin, Tag, message, Popconfirm,
  Drawer, Descriptions, Divider
} from 'antd';
import {
  UserAddOutlined, CheckOutlined, CloseOutlined, TeamOutlined,
  SearchOutlined, MessageOutlined, UserOutlined, EyeOutlined
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { useSocket } from '@/hooks/useSocket';
import {
  getNetworkUsers, getMyConnections, getPendingRequests, getSuggestions,
  sendConnectionRequest, acceptRequest, rejectRequest, removeConnection,
  getUserProfile,
} from '@/services/social';
import type { NetworkUser, PendingRequest, Connection, UserProfile } from '@/types/social';
import { getAvatarUrl } from '@/utils/helpers';
import styles from './index.less';

const { Search } = Input;


const NetworkPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUserId = initialState?.currentUser?.id ?? 0;
  const role = initialState?.currentUser?.role?.toLowerCase() || 'student';
  const { on } = useSocket();
  const [activeTab, setActiveTab] = useState('discover');
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<NetworkUser[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  // ── Profile Drawer ────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const openProfile = async (userId: number) => {
    setDrawerOpen(true);
    setProfileLoading(true);
    setSelectedProfile(null);
    try {
      const res = await getUserProfile(userId);
      setSelectedProfile(res.data);
    } catch {
      message.error('Không thể tải thông tin người dùng');
      setDrawerOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const setAction = (id: number, val: boolean) =>
    setActionLoading(prev => ({ ...prev, [id]: val }));

  const loadDiscover = async (kw = keyword) => {
    setLoading(true);
    try {
      const res = await getNetworkUsers({ keyword: kw });
      setUsers(res.data);
    } finally { setLoading(false); }
  };

  const loadConnections = async () => {
    setLoading(true);
    try {
      const res = await getMyConnections({ keyword });
      setConnections(res.data);
    } finally { setLoading(false); }
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await getPendingRequests();
      setPending(res.data);
    } finally { setLoading(false); }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await getSuggestions();
      setSuggestions(res.data);
    } finally { setLoading(false); }
  };

  // Load tất cả data ngay khi mount — không chờ user bấm từng tab
  useEffect(() => {
    loadDiscover();
    loadConnections();
    loadPending();
    loadSuggestions();
  }, []);

  // Reload lại khi user chủ động chuyển tab
  useEffect(() => {
    if (activeTab === 'discover') loadDiscover();
    if (activeTab === 'connections') loadConnections();
    if (activeTab === 'pending') loadPending();
    if (activeTab === 'suggestions') loadSuggestions();
  }, [activeTab]);

  // ── Socket: cập nhật realtime khi có kết nối mới ──────────
  useEffect(() => {
    // Người khác gửi lời mời kết nối đến mình
    const offReq = on('connection_request', ({ connectionId, from }: any) => {
      // Thêm vào tab pending
      setPending(prev => {
        if (prev.some(p => p.id === connectionId)) return prev;
        return [{ id: connectionId, user_id: from.id, full_name: from.fullName, avatar: from.avatar, role: '', created_at: new Date().toISOString() }, ...prev];
      });
      // Cập nhật status trong tab discover nếu user đang hiển thị
      setUsers(prev =>
        prev.map(u => u.id === from.id
          ? { ...u, connection_status: 'PENDING', direction: 'RECEIVED' }
          : u
        )
      );
      message.info(`${from.fullName} đã gửi lời mời kết nối`);
    });

    // Người kia chấp nhận lời mời của mình
    const offAcc = on('connection_accepted', ({ by }: any) => {
      // Cập nhật status trong tab discover
      setUsers(prev =>
        prev.map(u => u.id === by.id
          ? { ...u, connection_status: 'ACCEPTED' }
          : u
        )
      );
      // Reload connections nếu đang ở tab đó
      if (activeTab === 'connections') loadConnections();
      message.success(`${by.fullName} đã chấp nhận lời mời kết nối`);
    });

    return () => { offReq?.(); offAcc?.(); };
  }, [on, activeTab]);

  const handleConnect = async (userId: number) => {
    setAction(userId, true);
    try {
      await sendConnectionRequest(userId);
      message.success('Đã gửi lời mời kết nối');
      setUsers(prev =>
        prev.map(u => u.id === userId
          ? { ...u, connection_status: 'PENDING', direction: 'SENT' }
          : u
        )
      );
      setSuggestions(prev => prev.filter(u => u.id !== userId));
    } catch { message.error('Không thể gửi lời mời'); }
    finally { setAction(userId, false); }
  };

  const handleAccept = async (req: PendingRequest) => {
    setAction(req.id, true);
    try {
      await acceptRequest(req.id);
      message.success(`Đã kết nối với ${req.full_name}`);
      setPending(prev => prev.filter(p => p.id !== req.id));
    } catch { message.error('Thao tác thất bại'); }
    finally { setAction(req.id, false); }
  };

  const handleReject = async (reqId: number) => {
    try {
      await rejectRequest(reqId);
      setPending(prev => prev.filter(p => p.id !== reqId));
    } catch { message.error('Thao tác thất bại'); }
  };

  const handleRemove = async (connectionId: number) => {
    try {
      await removeConnection(connectionId);
      message.success('Đã huỷ kết nối');
      setConnections(prev => prev.filter(c => c.connection_id !== connectionId));
    } catch { message.error('Thao tác thất bại'); }
  };

  const handleMessage = async (userId: number) => {
    history.push(`/${role}/messages?partnerId=${userId}`);
  };

  const ConnectButton: React.FC<{ user: NetworkUser }> = ({ user }) => {
    if (user.connection_status === 'ACCEPTED') {
      return (
        <Button size="small" icon={<MessageOutlined />} onClick={() => handleMessage(user.id)}>
          Nhắn tin
        </Button>
      );
    }
    if (user.connection_status === 'PENDING' && user.direction === 'SENT') {
      return <Button size="small" disabled>Đã gửi lời mời</Button>;
    }
    if (user.connection_status === 'PENDING' && user.direction === 'RECEIVED') {
      return (
        <Button size="small" type="primary" onClick={() => handleAccept({ ...user, id: user.connection_id! } as any)}>
          Chấp nhận
        </Button>
      );
    }
    return (
      <Button
        size="small"
        type="primary"
        icon={<UserAddOutlined />}
        loading={actionLoading[user.id]}
        onClick={() => handleConnect(user.id)}
      >
        Kết nối
      </Button>
    );
  };

  const UserCard: React.FC<{ user: NetworkUser }> = ({ user }) => (
    <Card className={styles.userCard} size="small">
      <div className={styles.cardTop}>
        <Avatar size={56} src={getAvatarUrl(user.avatar)} icon={<UserOutlined />} />
        <Tag color={user.role === 'EMPLOYER' ? 'blue' : 'green'} className={styles.roleTag}>
          {user.role === 'EMPLOYER' ? 'Nhà tuyển dụng' : 'Sinh viên'}
        </Tag>
      </div>
      <div className={styles.cardName}>{user.full_name}</div>
      <div className={styles.cardSub}>{user.headline || user.company_name || '—'}</div>
      {(user.mutual_count ?? 0) > 0 && (
        <div className={styles.mutual}>{user.mutual_count} bạn chung</div>
      )}
      <div className={styles.cardActions}>
        <Button size="small" icon={<EyeOutlined />} onClick={() => openProfile(user.id)}>
          Xem
        </Button>
        <ConnectButton user={user} />
      </div>
    </Card>
  );

  // ── Profile Drawer component ──────────────────────────────
  const ProfileDrawer = () => (
    <Drawer
      title="Thông tin người dùng"
      placement="right"
      width={420}
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      footer={
        selectedProfile && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {selectedProfile.connection_status === 'ACCEPTED' ? (
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={() => { setDrawerOpen(false); handleMessage(selectedProfile.id); }}
              >
                Nhắn tin
              </Button>
            ) : selectedProfile.connection_status === 'PENDING' && selectedProfile.direction === 'SENT' ? (
              <Button disabled>Đã gửi lời mời</Button>
            ) : selectedProfile.connection_status !== 'PENDING' ? (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => { handleConnect(selectedProfile.id); setDrawerOpen(false); }}
              >
                Kết nối
              </Button>
            ) : null}
          </div>
        )
      }
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
                      {selectedProfile.university && (
                        <Descriptions.Item label="Trường">{selectedProfile.university}</Descriptions.Item>
                      )}
                      {selectedProfile.major && (
                        <Descriptions.Item label="Ngành">{selectedProfile.major}</Descriptions.Item>
                      )}
                      {selectedProfile.graduation_year && (
                        <Descriptions.Item label="Năm tốt nghiệp">{selectedProfile.graduation_year}</Descriptions.Item>
                      )}
                      {selectedProfile.gpa != null && (
                        <Descriptions.Item label="GPA">{selectedProfile.gpa}</Descriptions.Item>
                      )}
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
                          {exp.start_date ? exp.start_date.slice(0, 7) : ''}
                          {' — '}
                          {exp.current ? 'Hiện tại' : exp.end_date ? exp.end_date.slice(0, 7) : ''}
                        </div>
                        {exp.description && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{exp.description}</div>
                        )}
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
  );

  return (
    <div className={styles.page}>
      <ProfileDrawer />
      <div className={styles.header}>
        <h1>Mạng lưới</h1>
        <Search
          placeholder="Tìm kiếm tên, công ty..."
          allowClear
          style={{ width: 280 }}
          onSearch={kw => { setKeyword(kw); loadDiscover(kw); }}
          prefix={<SearchOutlined />}
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'discover',
            label: 'Khám phá',
            children: (
              <Spin spinning={loading}>
                {users.length === 0 ? (
                  <Empty description="Không tìm thấy người dùng" />
                ) : (
                  <div className={styles.grid}>
                    {users.map(u => <UserCard key={u.id} user={u} />)}
                  </div>
                )}
              </Spin>
            ),
          },
          {
            key: 'connections',
            label: (
              <span><TeamOutlined /> Kết nối của tôi ({connections.length})</span>
            ),
            children: (
              <Spin spinning={loading}>
                {connections.length === 0 ? (
                  <Empty description="Chưa có kết nối nào" />
                ) : (
                  <div className={styles.list}>
                    {connections.map(c => (
                      <div key={c.connection_id} className={styles.listItem}>
                        <Avatar size={48} src={getAvatarUrl(c.avatar)} icon={<UserOutlined />} />
                        <div className={styles.listInfo}>
                          <div className={styles.listName}>{c.full_name}</div>
                          <div className={styles.listSub}>{c.headline || c.company_name}</div>
                        </div>
                        <div className={styles.listActions}>
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => openProfile(c.user_id)}
                          >
                            Xem
                          </Button>
                          <Button
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={() => handleMessage(c.user_id)}
                          >
                            Nhắn tin
                          </Button>
                          <Popconfirm
                            title="Huỷ kết nối?"
                            onConfirm={() => handleRemove(c.connection_id)}
                            okText="Huỷ kết nối"
                            cancelText="Không"
                          >
                            <Button size="small" danger>Huỷ</Button>
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Spin>
            ),
          },
          {
            key: 'pending',
            label: (
              <Badge count={pending.length} size="small">
                <span>Lời mời</span>
              </Badge>
            ),
            children: (
              <Spin spinning={loading}>
                {pending.length === 0 ? (
                  <Empty description="Không có lời mời nào" />
                ) : (
                  <div className={styles.list}>
                    {pending.map(req => (
                      <div key={req.id} className={styles.listItem}>
                        <Avatar size={48} src={getAvatarUrl(req.avatar)} icon={<UserOutlined />} />
                        <div className={styles.listInfo}>
                          <div className={styles.listName}>{req.full_name}</div>
                          <div className={styles.listSub}>{req.headline}</div>
                        </div>
                        <div className={styles.listActions}>
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => openProfile(req.user_id)}
                          >
                            Xem
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckOutlined />}
                            loading={actionLoading[req.id]}
                            onClick={() => handleAccept(req)}
                          >
                            Chấp nhận
                          </Button>
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => handleReject(req.id)}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Spin>
            ),
          },
          {
            key: 'suggestions',
            label: 'Gợi ý',
            children: (
              <Spin spinning={loading}>
                {suggestions.length === 0 ? (
                  <Empty description="Không có gợi ý" />
                ) : (
                  <div className={styles.grid}>
                    {suggestions.map(u => <UserCard key={u.id} user={u} />)}
                  </div>
                )}
              </Spin>
            ),
          },
        ]}
      />
    </div>
  );
};

export default NetworkPage;