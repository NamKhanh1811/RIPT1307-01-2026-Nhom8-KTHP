import {
  Card, Select, Table, Tag, Button, Typography, Space,
  Avatar, Progress, Modal, message, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { jobService } from '@/services/jobs';
import { applicationService } from '@/services/applications';
import { rankCandidates, getMatchColor } from '@/utils/matching';
import { getInitials, formatDate } from '@/utils/helpers';
import type { Job, Application } from '@/types';

const { Title, Text } = Typography;

export default function CandidatesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    jobService.getMyJobs().then((res) => {
      if (res.success) setJobs(res.data);
    });
  }, []);

  const onSelectJob = async (jobId: number) => {
    setSelectedJob(jobId);
    setLoading(true);
    const res = await applicationService.getApplicationsByJob(jobId);
    if (res.success) {
      setCandidates(rankCandidates(res.data)); // AI ranking by matchScore
    }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: 'APPROVED' | 'REJECTED', note?: string) => {
    const res = await applicationService.updateStatus(id, status, note);
    if (res.success) {
      message.success(status === 'APPROVED' ? 'Đã duyệt ứng viên' : 'Đã từ chối ứng viên');
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c)),
      );
    }
  };

  const columns: ColumnsType<Application> = [
    {
      title: 'Xếp hạng',
      width: 60,
      render: (_, __, index) => (
        index === 0
          ? <Tag color="gold"><TrophyOutlined /> #1</Tag>
          : <Text type="secondary">#{index + 1}</Text>
      ),
    },
    {
      title: 'Ứng viên',
      render: (_, record) => (
        <Space>
          <Avatar style={{ background: '#E6F1FB', color: '#185FA5' }}>
            {getInitials(record.user?.fullName ?? 'U')}
          </Avatar>
          <div>
            <div><strong>{record.user?.fullName}</strong></div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Match Score',
      dataIndex: 'matchScore',
      sorter: (a, b) => a.matchScore - b.matchScore,
      defaultSortOrder: 'descend',
      render: (score) => (
        <Space direction="vertical" size={2} style={{ width: 120 }}>
          <Tag color={getMatchColor(score)}>{score}%</Tag>
          <Progress percent={score} size="small" showInfo={false}
            strokeColor={score >= 80 ? '#0F6E56' : score >= 60 ? '#EF9F27' : '#888'} />
        </Space>
      ),
    },
    {
      title: 'Kỹ năng phù hợp',
      render: (_, record) => (
        <Space wrap size={4}>
          {record.cvProfile?.skills?.slice(0, 4).map((s) => (
            <Tag key={s} color="blue">{s}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'appliedAt',
      render: formatDate,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange'}>
          {status === 'APPROVED' ? 'Đã duyệt' : status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        record.status === 'PENDING' ? (
          <Space>
            <Button size="small" type="primary" onClick={() => updateStatus(record.id, 'APPROVED')}>
              Duyệt
            </Button>
            <Button size="small" danger onClick={() => updateStatus(record.id, 'REJECTED')}>
              Từ chối
            </Button>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        )
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Quản lý ứng viên</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text>Chọn tin tuyển dụng:</Text>
          <Select
            style={{ width: 320 }}
            placeholder="Chọn job để xem ứng viên"
            onChange={onSelectJob}
            options={jobs.map((j) => ({ label: j.title, value: j.id }))}
          />
        </Space>
      </Card>

      {selectedJob ? (
        <Card
          title={
            <Space>
              Danh sách ứng viên
              <Tag color="blue">{candidates.length} người</Tag>
              <Tag color="purple">Xếp hạng theo AI Match Score</Tag>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={candidates}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ) : (
        <Empty description="Chọn một tin tuyển dụng để xem danh sách ứng viên" />
      )}
    </div>
  );
}
