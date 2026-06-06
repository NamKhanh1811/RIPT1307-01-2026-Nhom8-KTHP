import React, { useState, useEffect } from 'react';
import {
  Tabs, Input, Button, Avatar, Card, Badge, Empty, Spin, Tag, message, Popconfirm
} from 'antd';
import {
  UserAddOutlined, CheckOutlined, CloseOutlined, TeamOutlined,
  SearchOutlined, MessageOutlined, UserOutlined
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import {
  getNetworkUsers, getMyConnections, getPendingRequests, getSuggestions,
  sendConnectionRequest, acceptRequest, rejectRequest, removeConnection
} from '@/services/social';
import type { NetworkUser, PendingRequest, Connection } from '@/types/social';
import styles from './index.less';

const { Search } = Input;


const NetworkPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const role = initialState?.currentUser?.role?.toLowerCase() || 'student';
  const [activeTab, setActiveTab] = useState('discover');
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<NetworkUser[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

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

  useEffect(() => {
    if (activeTab === 'discover') loadDiscover();
    if (activeTab === 'connections') loadConnections();
    if (activeTab === 'pending') loadPending();
    if (activeTab === 'suggestions') loadSuggestions();
  }, [activeTab]);

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
        <Avatar size={56} src={user.avatar} icon={<UserOutlined />} />
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
        <ConnectButton user={user} />
      </div>
    </Card>
  );

  return (
    <div className={styles.page}>
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
                        <Avatar size={48} src={c.avatar} icon={<UserOutlined />} />
                        <div className={styles.listInfo}>
                          <div className={styles.listName}>{c.full_name}</div>
                          <div className={styles.listSub}>{c.headline || c.company_name}</div>
                        </div>
                        <div className={styles.listActions}>
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
                        <Avatar size={48} src={req.avatar} icon={<UserOutlined />} />
                        <div className={styles.listInfo}>
                          <div className={styles.listName}>{req.full_name}</div>
                          <div className={styles.listSub}>{req.headline}</div>
                        </div>
                        <div className={styles.listActions}>
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