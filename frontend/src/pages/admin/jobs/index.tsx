import {
  Card, Table, Tag, Typography, Space, Button, message,
  Modal, Input, Tabs, Descriptions, Badge, Grid,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import request from '@/services/request';
import { jobService } from '@/services/jobs';
import { INDUSTRIES, JOB_TYPES } from '@/constants';
import { formatDate, formatCurrency, daysUntil } from '@/utils/helpers';
import type { Job } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Job | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => { loadAllJobs(); }, []);

  const loadAllJobs = async () => {
    setLoading(true);
    const res = await request.get<never, any>('/admin/jobs').catch(() => null);
    if (res?.success) setJobs(res.data);
    setLoading(false);
  };

  const approveJob = async (id: number) => {
    const res = await jobService.approveJob(id);
    if (res.success) {
      message.success('Đã duyệt tin tuyển dụng');
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'APPROVED' } : j));
    }
  };

  const rejectJob = async (id: number) => {
    const res = await jobService.rejectJob(id, rejectNote);
    if (res.success) {
      message.success('Đã từ chối tin tuyển dụng');
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'REJECTED' } : j));
      setPreview(null);
    }
  };

  const filtered = jobs.filter((j) => j.status === activeTab);

  const STATUS_COLOR: Record<string, string> = {
    PENDING: 'orange', APPROVED: 'green', REJECTED: 'red', CLOSED: 'default',
  };
  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CLOSED: 'Đã đóng',
  };

  const columns: ColumnsType<Job> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      render: (title, record) => (
        <div>
          <a onClick={() => setPreview(record)}><strong>{title}</strong></a>
          {isMobile && (
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {record.company?.name ?? '—'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Công ty',
      render: (_, r) => r.company?.name ?? '—',
      responsive: ['md'],
    },
    {
      title: 'Ngành',
      dataIndex: 'industry',
      render: (v) => INDUSTRIES.find((i) => i.value === v)?.label ?? v,
      responsive: ['lg'],
    },
    {
      title: 'Loại hình',
      dataIndex: 'type',
      render: (v) => JOB_TYPES.find((t) => t.value === v)?.label ?? v,
      responsive: ['lg'],
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'createdAt',
      render: formatDate,
      responsive: ['md'],
    },
    {
      title: 'Hành động',
      width: isMobile ? 80 : 160,
      render: (_, record) =>
        record.status === 'PENDING' ? (
          <Space size={4} wrap={isMobile}>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => approveJob(record.id)}>
              {isMobile ? '' : 'Duyệt'}
            </Button>
            <Button size="small" danger icon={<CloseOutlined />}
              onClick={() => setPreview(record)}>
              {isMobile ? '' : 'Từ chối'}
            </Button>
          </Space>
        ) : (
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreview(record)}>
            {isMobile ? '' : 'Xem'}
          </Button>
        ),
    },
  ];

  const tabItems = ['PENDING', 'APPROVED', 'REJECTED'].map((status) => ({
    key: status,
    label: (
      <span>
        {isMobile ? STATUS_LABEL[status].split(' ')[0] : STATUS_LABEL[status]}{' '}
        <Badge count={jobs.filter((j) => j.status === status).length}
          color={STATUS_COLOR[status]} />
      </span>
    ),
  }));

  return (
    <div>
      <Title level={isMobile ? 5 : 4}>Duyệt tin tuyển dụng</Title>

      <Card bodyStyle={{ padding: isMobile ? '0 0 12px' : undefined }}>
        <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab}
          style={{ padding: isMobile ? '0 12px' : undefined }} />
        <div style={{ padding: isMobile ? '0 12px' : undefined }}>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: isMobile ? 8 : 10, size: isMobile ? 'small' : 'default' }}
            size={isMobile ? 'small' : 'middle'}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Chi tiết tin tuyển dụng"
        open={!!preview}
        onCancel={() => { setPreview(null); setRejectNote(''); }}
        width={isMobile ? '95vw' : 700}
        style={isMobile ? { top: 10 } : undefined}
        footer={
          preview?.status === 'PENDING' ? (
            <Space wrap={isMobile} style={isMobile ? { width: '100%', justifyContent: 'flex-end' } : undefined}>
              <Button onClick={() => { setPreview(null); setRejectNote(''); }}>Đóng</Button>
              <Button danger onClick={() => rejectJob(preview!.id)}>Từ chối</Button>
              <Button type="primary" onClick={() => { approveJob(preview!.id); setPreview(null); }}>
                ✓ Duyệt tin này
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setPreview(null)}>Đóng</Button>
          )
        }
      >
        {preview && (
          <div>
            <Descriptions
              column={isMobile ? 1 : 2}
              bordered
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Tiêu đề" span={isMobile ? 1 : 2}>{preview.title}</Descriptions.Item>
              <Descriptions.Item label="Công ty">{preview.company?.name}</Descriptions.Item>
              <Descriptions.Item label="Ngành">
                {INDUSTRIES.find((i) => i.value === preview.industry)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="Loại hình">
                {JOB_TYPES.find((t) => t.value === preview.type)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm">{preview.location}</Descriptions.Item>
              <Descriptions.Item label="Lương">
                {preview.salaryMin
                  ? `${formatCurrency(preview.salaryMin)} – ${formatCurrency(preview.salaryMax ?? 0)}`
                  : 'Thỏa thuận'}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn nộp">{formatDate(preview.deadline)}</Descriptions.Item>
              <Descriptions.Item label="Kỹ năng" span={isMobile ? 1 : 2}>
                <Space wrap>{preview.skills?.map((s) => <Tag key={s}>{s}</Tag>)}</Space>
              </Descriptions.Item>
            </Descriptions>

            <Text strong>Mô tả công việc:</Text>
            <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{preview.description}</Paragraph>

            {preview.status === 'PENDING' && (
              <>
                <Text strong>Lý do từ chối (nếu có):</Text>
                <Input.TextArea
                  rows={2}
                  style={{ marginTop: 8 }}
                  placeholder="Nội dung không phù hợp..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}