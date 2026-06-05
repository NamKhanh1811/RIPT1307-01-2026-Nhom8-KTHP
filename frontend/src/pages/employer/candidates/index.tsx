import {
  Card, Select, Table, Tag, Button, Typography, Space,
  Avatar, Progress, Modal, message, Empty, Divider, Grid,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserOutlined, TrophyOutlined, EyeOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { jobService } from '@/services/jobs';
import { applicationService } from '@/services/applications';
import { rankCandidates, getMatchColor } from '@/utils/matching';
import { getInitials, formatDate } from '@/utils/helpers';
import type { Job, Application } from '@/types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getFullPdfUrl(pdfUrl: string): string {
  if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) return pdfUrl;
  return `${BACKEND_URL}${pdfUrl}`;
}

export default function CandidatesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [cvModal, setCvModal] = useState<{ open: boolean; candidate: Application | null }>({
    open: false,
    candidate: null,
  });
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    jobService.getMyJobs().then((res) => {
      if (res.success) setJobs(res.data);
    });
  }, []);

  const onSelectJob = async (jobId: number) => {
    setSelectedJob(jobId);
    setLoading(true);
    const res = await applicationService.getApplicationsByJob(jobId);
    if (res.success) setCandidates(rankCandidates(res.data));
    setLoading(false);
  };

  const updateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    const res = await applicationService.updateStatus(id, status);
    if (res.success) {
      message.success(status === 'APPROVED' ? 'Đã duyệt ứng viên' : 'Đã từ chối ứng viên');
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    }
  };

  const columns: ColumnsType<Application> = [
    {
      title: '#',
      width: isMobile ? 40 : 60,
      render: (_, __, index) =>
        index === 0
          ? <Tag color="gold"><TrophyOutlined /></Tag>
          : <Text type="secondary" style={{ fontSize: 12 }}>#{index + 1}</Text>,
    },
    {
      title: 'Ứng viên',
      render: (_, record) => (
        <Space align="start">
          <Avatar style={{ background: '#E6F1FB', color: '#185FA5', flexShrink: 0 }}>
            {getInitials(record.user?.fullName ?? 'U')}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div><strong style={{ fontSize: isMobile ? 13 : undefined }}>{record.user?.fullName}</strong></div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
            {record.cvProfile?.headline && (
              <div><Text type="secondary" style={{ fontSize: 12 }}>{record.cvProfile.headline}</Text></div>
            )}
            {/* On mobile: show match score inline */}
            {isMobile && (
              <div style={{ marginTop: 4 }}>
                <Tag color={getMatchColor(record.matchScore)} style={{ fontSize: 11 }}>
                  {record.matchScore}% match
                </Tag>
                <Tag
                  color={record.status === 'APPROVED' ? 'green' : record.status === 'REJECTED' ? 'red' : 'orange'}
                  style={{ fontSize: 11 }}
                >
                  {record.status === 'APPROVED' ? 'Đã duyệt' : record.status === 'REJECTED' ? 'Từ chối' : 'Chờ'}
                </Tag>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Match',
      dataIndex: 'matchScore',
      sorter: (a, b) => a.matchScore - b.matchScore,
      defaultSortOrder: 'descend',
      responsive: ['md'],
      render: (score) => (
        <Space direction="vertical" size={2} style={{ width: 110 }}>
          <Tag color={getMatchColor(score)}>{score}%</Tag>
          <Progress percent={score} size="small" showInfo={false}
            strokeColor={score >= 80 ? '#0F6E56' : score >= 60 ? '#EF9F27' : '#888'} />
        </Space>
      ),
    },
    {
      title: 'Kỹ năng',
      responsive: ['lg'],
      render: (_, record) => (
        <Space wrap size={4}>
          {record.cvProfile?.skills?.slice(0, 4).map((s) => (
            <Tag key={s} color="blue">{s}</Tag>
          ))}
          {(record.cvProfile?.skills?.length ?? 0) > 4 && (
            <Tag>+{(record.cvProfile?.skills?.length ?? 0) - 4}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'appliedAt',
      render: formatDate,
      responsive: ['md'],
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      responsive: ['md'],
      render: (status) => (
        <Tag color={status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange'}>
          {status === 'APPROVED' ? 'Đã duyệt' : status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      width: isMobile ? 80 : 130,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setCvModal({ open: true, candidate: record })}>
            {isMobile ? '' : 'Xem CV'}
          </Button>
          {record.status === 'PENDING' && (
            <Space size={4}>
              <Button size="small" type="primary" onClick={() => updateStatus(record.id, 'APPROVED')}>
                {isMobile ? '✓' : 'Duyệt'}
              </Button>
              <Button size="small" danger onClick={() => updateStatus(record.id, 'REJECTED')}>
                {isMobile ? '✗' : 'Từ chối'}
              </Button>
            </Space>
          )}
        </Space>
      ),
    },
  ];

  const cv = cvModal.candidate?.cvProfile;
  const fullPdfUrl = cv?.pdfUrl ? getFullPdfUrl(cv.pdfUrl) : null;

  return (
    <div>
      <Title level={isMobile ? 5 : 4}>Quản lý ứng viên</Title>

      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: isMobile ? '12px' : undefined }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, alignItems: isMobile ? 'stretch' : 'center' }}>
          <Text style={{ whiteSpace: 'nowrap' }}>Chọn tin tuyển dụng:</Text>
          <Select
            style={{ width: isMobile ? '100%' : 320 }}
            placeholder="Chọn job để xem ứng viên"
            onChange={onSelectJob}
            options={jobs.map((j) => ({ label: j.title, value: j.id }))}
          />
        </div>
      </Card>

      {selectedJob ? (
        <Card
          bodyStyle={{ padding: isMobile ? '0 0 12px' : undefined }}
          title={
            <Space wrap size={4}>
              <span>Danh sách ứng viên</span>
              <Tag color="blue">{candidates.length} người</Tag>
              {!isMobile && <Tag color="purple">Xếp hạng theo AI Match Score</Tag>}
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={candidates}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: isMobile ? 8 : 10, size: isMobile ? 'small' : 'default' }}
            size={isMobile ? 'small' : 'middle'}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      ) : (
        <Empty description="Chọn một tin tuyển dụng để xem danh sách ứng viên" />
      )}

      {/* Modal xem CV ứng viên */}
      <Modal
        open={cvModal.open}
        onCancel={() => setCvModal({ open: false, candidate: null })}
        footer={null}
        title={
          <Space>
            <UserOutlined />
            CV của {cvModal.candidate?.user?.fullName ?? 'ứng viên'}
          </Space>
        }
        width={isMobile ? '95vw' : 800}
        style={isMobile ? { top: 10 } : undefined}
        destroyOnClose
      >
        {cv ? (
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>{cv.headline ?? '—'}</Title>
              <Text type="secondary">
                {[cv.university, cv.major].filter(Boolean).join(' · ')}
                {cv.graduationYear ? ` · Tốt nghiệp ${cv.graduationYear}` : ''}
                {cv.gpa ? ` · GPA: ${cv.gpa}` : ''}
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  📧 {cvModal.candidate?.user?.email}
                </Text>
              </div>
            </div>

            {cv.summary && (
              <>
                <Divider orientation="left" plain>Giới thiệu bản thân</Divider>
                <Text>{cv.summary}</Text>
              </>
            )}

            <Divider orientation="left" plain>Kỹ năng</Divider>
            {cv.skills?.length ? (
              <Space wrap size={4}>
                {cv.skills.map((s) => <Tag key={s} color="blue">{s}</Tag>)}
              </Space>
            ) : (
              <Text type="secondary">Chưa có kỹ năng</Text>
            )}

            <Divider orientation="left" plain>Match Score với vị trí này</Divider>
            <Space wrap>
              <Tag color={getMatchColor(cvModal.candidate?.matchScore ?? 0)} style={{ fontSize: 14, padding: '2px 10px' }}>
                {cvModal.candidate?.matchScore ?? 0}%
              </Tag>
              <Progress
                percent={cvModal.candidate?.matchScore ?? 0}
                style={{ width: isMobile ? 150 : 200 }}
                strokeColor={
                  (cvModal.candidate?.matchScore ?? 0) >= 80 ? '#0F6E56'
                  : (cvModal.candidate?.matchScore ?? 0) >= 60 ? '#EF9F27' : '#888'
                }
              />
            </Space>

            {fullPdfUrl ? (
              <>
                <Divider orientation="left" plain>CV PDF đã upload</Divider>
                <iframe
                  src={fullPdfUrl}
                  style={{
                    width: '100%',
                    height: isMobile ? 320 : 500,
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                  }}
                  title="CV PDF"
                />
              </>
            ) : (
              <>
                <Divider orientation="left" plain>CV PDF</Divider>
                <Text type="secondary">Ứng viên chưa upload CV PDF</Text>
              </>
            )}
          </div>
        ) : (
          <Empty description="Ứng viên chưa tạo CV trên hệ thống" />
        )}
      </Modal>
    </div>
  );
}