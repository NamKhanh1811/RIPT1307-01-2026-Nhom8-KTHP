import { Card, Table, Tag, Typography, Empty, Spin, Grid } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { applicationService } from '@/services/applications';
import { getMatchColor } from '@/utils/matching';
import { formatDate } from '@/utils/helpers';
import { APPLICATION_STATUS } from '@/constants';
import type { Application } from '@/types';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
        <div>
          <strong>{title ?? `Job #${record.jobId}`}</strong>
          {isMobile && (
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {record.job?.company?.name ?? '—'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Công ty',
      dataIndex: ['job', 'company', 'name'],
      render: (name) => name ?? '—',
      responsive: ['md'],
    },
    {
      title: 'Match',
      dataIndex: 'matchScore',
      sorter: (a, b) => a.matchScore - b.matchScore,
      render: (score) => (
        <Tag color={getMatchColor(score)}>{score}%</Tag>
      ),
      width: isMobile ? 70 : 100,
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
      width: isMobile ? 90 : 120,
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'appliedAt',
      sorter: (a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(),
      render: formatDate,
      responsive: ['sm'],
    },
    {
      title: 'Phản hồi',
      dataIndex: 'employerNote',
      render: (note) => note ?? <Tag>Chưa có</Tag>,
      responsive: ['lg'],
    },
  ];

  return (
    <div>
      <Title level={isMobile ? 5 : 4}>Danh sách ứng tuyển</Title>
      <Card bodyStyle={{ padding: isMobile ? '12px 12px' : undefined }}>
        <Table
          columns={columns}
          dataSource={apps}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="Bạn chưa ứng tuyển công việc nào" /> }}
          pagination={{ pageSize: isMobile ? 8 : 10, size: isMobile ? 'small' : 'default' }}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
}