import {
  Card, Table, Tag, Typography, Input, Select, Space,
  Button, Popconfirm, message, Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import request from '@/services/request';
import { formatDate, getInitials } from '@/utils/helpers';
import type { User, UserRole } from '@/types';

const { Title } = Typography;

const ROLE_COLORS: Record<UserRole, string> = {
  STUDENT: 'blue',
  EMPLOYER: 'green',
  ADMIN: 'red',
};
const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Sinh viên',
  EMPLOYER: 'Doanh nghiệp',
  ADMIN: 'Admin',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await request.get<never, any>('/admin/users').catch(() => null);
    if (res?.success) setUsers(res.data);
    setLoading(false);
  };

  const deleteUser = async (id: number) => {
    const res = await request.delete<never, any>(`/admin/users/${id}`).catch(() => null);
    if (res?.success) {
      message.success('Đã xóa user');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      render: (_, record) => (
        <Space>
          <Avatar style={{ background: '#E6F1FB', color: '#185FA5' }}>
            {getInitials(record.fullName)}
          </Avatar>
          <div>
            <div><strong>{record.fullName}</strong></div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      render: (role: UserRole) => (
        <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      render: formatDate,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Hành động',
      width: 100,
      render: (_, record) =>
        record.role !== 'ADMIN' ? (
          <Popconfirm title="Xóa user này?" onConfirm={() => deleteUser(record.id)}>
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        ) : <Tag>Protected</Tag>,
    },
  ];

  return (
    <div>
      <Title level={4}>Quản lý người dùng</Title>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm tên, email..."
            style={{ width: 260 }}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Lọc vai trò"
            style={{ width: 160 }}
            allowClear
            onChange={(v) => setRoleFilter(v ?? '')}
          >
            <Select.Option value="STUDENT">Sinh viên</Select.Option>
            <Select.Option value="EMPLOYER">Doanh nghiệp</Select.Option>
            <Select.Option value="ADMIN">Admin</Select.Option>
          </Select>
          <Tag>Tổng: {filtered.length} user</Tag>
        </Space>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </div>
  );
}
