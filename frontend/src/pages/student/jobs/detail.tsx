import {
  Row, Col, Card, Tag, Button, Typography, Space, Divider,
  Descriptions, Progress, message, Breadcrumb, Avatar, Badge,
} from 'antd';
import {
  EnvironmentOutlined, ClockCircleOutlined, DollarOutlined,
  TeamOutlined, CheckCircleOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { useParams, history, useModel } from '@umijs/max';
import { useEffect, useState } from 'react';
import { jobService } from '@/services/jobs';
import { cvService } from '@/services/cv';
import { applicationService } from '@/services/applications';
import { calcMatchScore, getMatchedSkills, getMatchColor, getMatchLabel } from '@/utils/matching';
import { formatCurrency, daysUntil, formatDate } from '@/utils/helpers';
import type { Job, CvProfile } from '@/types';

const { Title, Text, Paragraph } = Typography;

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [cv, setCv] = useState<CvProfile | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      jobService.getJobById(Number(id)),
      cvService.getMyCv().catch(() => null),
    ]).then(([jobRes, cvRes]) => {
      if (jobRes.success) setJob(jobRes.data);
      if (cvRes?.success) setCv(cvRes.data);
    });
  }, [id]);

  if (!job) return null;

  const matchScore = cv ? calcMatchScore(cv.skills, job.skills) : 0;
  const matchedSkills = cv ? getMatchedSkills(cv.skills, job.skills) : [];
  const days = daysUntil(job.deadline);

  const handleApply = async () => {
    if (!cv) {
      message.warning('Bạn cần tạo CV trước khi ứng tuyển!');
      history.push('/student/cv');
      return;
    }
    setApplying(true);
    const res = await applicationService.apply(job.id).catch(() => null);
    setApplying(false);
    if (res?.success) {
      setApplied(true);
      message.success('Ứng tuyển thành công! Email xác nhận đã được gửi.');
    }
  };

  const JOB_TYPE_LABELS: Record<string, string> = {
    INTERNSHIP: 'Thực tập',
    FULL_TIME: 'Toàn thời gian',
    PART_TIME: 'Bán thời gian',
  };

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[
        { title: <a onClick={() => history.push('/student/jobs')}>← Danh sách việc làm</a> },
        { title: job.title },
      ]} />

      <Row gutter={24}>
        {/* Main content */}
        <Col span={16}>
          <Card>
            <Space align="start" style={{ marginBottom: 16 }}>
              <Avatar size={56} style={{ background: '#E6F1FB', color: '#185FA5', fontSize: 20 }}>
                {(job.company?.name ?? 'C')[0]}
              </Avatar>
              <div>
                <Title level={3} style={{ margin: 0 }}>{job.title}</Title>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  {job.company?.name} · <EnvironmentOutlined /> {job.location}
                  {job.remote && <Tag style={{ marginLeft: 8 }}>Remote OK</Tag>}
                </Text>
              </div>
            </Space>

            <Space wrap style={{ marginBottom: 20 }}>
              <Tag color="blue">{JOB_TYPE_LABELS[job.type]}</Tag>
              <Tag icon={<ClockCircleOutlined />} color={days <= 3 ? 'red' : 'default'}>
                Còn {days} ngày (hạn {formatDate(job.deadline)})
              </Tag>
              {job.salaryMin && (
                <Tag icon={<DollarOutlined />} color="green">
                  {formatCurrency(job.salaryMin)} – {formatCurrency(job.salaryMax ?? 0)}
                </Tag>
              )}
            </Space>

            <Divider />

            <Title level={5}>Mô tả công việc</Title>
            <Paragraph style={{ whiteSpace: 'pre-line' }}>{job.description}</Paragraph>

            {job.requirements && (
              <>
                <Title level={5}>Yêu cầu ứng viên</Title>
                <Paragraph style={{ whiteSpace: 'pre-line' }}>{job.requirements}</Paragraph>
              </>
            )}

            <Divider />

            <Title level={5}>Kỹ năng yêu cầu</Title>
            <Space wrap>
              {job.skills.map((skill) => {
                const isMatch = matchedSkills.includes(skill);
                return (
                  <Tag key={skill} color={isMatch ? 'blue' : undefined}
                    icon={isMatch ? <CheckCircleOutlined /> : undefined}>
                    {skill}
                  </Tag>
                );
              })}
            </Space>
            {cv && matchedSkills.length > 0 && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                ✅ Bạn có <strong>{matchedSkills.length}/{job.skills.length}</strong> kỹ năng phù hợp
              </Text>
            )}
          </Card>
        </Col>

        {/* Sidebar */}
        <Col span={8}>
          {/* Apply card */}
          <Card style={{ marginBottom: 16, textAlign: 'center' }}>
            {cv && matchScore > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">Độ phù hợp CV của bạn</Text>
                <div>
                  <Progress
                    type="circle"
                    percent={matchScore}
                    strokeColor={matchScore >= 80 ? '#0F6E56' : matchScore >= 60 ? '#EF9F27' : '#888'}
                    size={80}
                  />
                </div>
                <Tag color={getMatchColor(matchScore)} style={{ marginTop: 8 }}>
                  {getMatchLabel(matchScore)}
                </Tag>
              </div>
            )}

            {!cv && (
              <div style={{ marginBottom: 12 }}>
                <Text type="warning">⚠️ Tạo CV để xem độ phù hợp</Text>
              </div>
            )}

            <Button
              type="primary"
              size="large"
              block
              loading={applying}
              disabled={applied}
              onClick={handleApply}
              icon={applied ? <CheckCircleOutlined /> : undefined}
            >
              {applied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
            </Button>

            {!cv && (
              <Button block style={{ marginTop: 8 }} onClick={() => history.push('/student/cv')}>
                Tạo CV trước
              </Button>
            )}
          </Card>

          {/* Job info */}
          <Card title="Thông tin tuyển dụng">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Ngành">{job.industry}</Descriptions.Item>
              <Descriptions.Item label="Loại hình">{JOB_TYPE_LABELS[job.type]}</Descriptions.Item>
              <Descriptions.Item label="Địa điểm">{job.location}</Descriptions.Item>
              <Descriptions.Item label="Làm từ xa">{job.remote ? 'Có' : 'Không'}</Descriptions.Item>
              <Descriptions.Item label="Đăng ngày">{formatDate(job.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Hạn nộp">{formatDate(job.deadline)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
