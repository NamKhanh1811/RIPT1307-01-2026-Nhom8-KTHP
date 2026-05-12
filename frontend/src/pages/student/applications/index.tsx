import { Card, Table, Tag, Typography, Empty, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { applicationService } from '@/services/applications';
import { getMatchColor } from '@/utils/matching';
import { formatDate } from '@/utils/helpers';
import { APPLICATION_STATUS } from '@/constants';
import type { Application } from '@/types';

const { Title } = Typography;

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationService.getMyApplications().then((res) => {
      if (res.success) setApps(res.data);
      setLoading(false);
    });
  }, []);

  const columns: ColumnsType<Application> = [
    {
      title: 'Vị trí',
      dataIndex: ['job', 'title'],
      render: (title, record) => (
        <strong>{title ?? `Job #${record.jobId}`}</strong>
      ),
    },
    {
      title: 'Công ty',
      dataIndex: ['job', 'company', 'name'],
      render: (name) => name ?? '—',
    },
    {
      title: 'Match Score',
      dataIndex: 'matchScore',
      sorter: (a, b) => a.matchScore - b.matchScore,
      render: (score) => (
        <Tag color={getMatchColor(score)}>{score}%</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      filters: [
        { text: 'Chờ duyệt', value: 'PENDING' },
        { text: 'Đã duyệt', value: 'APPROVED' },
        { text: 'Từ chối', value: 'REJECTED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const s = APPLICATION_STATUS[status as keyof typeof APPLICATION_STATUS];
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'appliedAt',
      sorter: (a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(),
      render: formatDate,
    },
    {
      title: 'Phản hồi',
      dataIndex: 'employerNote',
      render: (note) => note ?? <Tag>Chưa có phản hồi</Tag>,
    },
  ];

  return (
    <div>
      <Title level={4}>Danh sách ứng tuyển</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={apps}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="Bạn chưa ứng tuyển công việc nào" /> }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
