import {
  Row, Col, Card, Input, Select, Tag, Button, Typography, Space,
  List, Empty, Spin, Drawer, Divider, Descriptions, Progress,
  Avatar, message,
} from 'antd';
import {
  SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined,
  CheckCircleOutlined, BankOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { useEffect, useState } from 'react';
import { jobService } from '@/services/jobs';
import { cvService } from '@/services/cv';
import { applicationService } from '@/services/applications';
import { enrichJobsWithMatchScore, calcMatchScore, getMatchedSkills, getMatchColor, getMatchLabel } from '@/utils/matching';
import { formatCurrency, daysUntil, formatDate } from '@/utils/helpers';
import { INDUSTRIES, JOB_TYPES } from '@/constants';
import type { Job, CvProfile, JobFilter } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const JOB_TYPE_LABELS: Record<string, string> = {
  INTERNSHIP: 'Thực tập',
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
};

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cv, setCv] = useState<CvProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JobFilter>({});

  // Drawer state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const loadAll = async () => {
    setLoading(true);
    const [cvRes, jobRes] = await Promise.allSettled([
      cvService.getMyCv(),
      jobService.getJobs(),
    ]);
    let myCv: CvProfile | null = null;
    if (cvRes.status === 'fulfilled' && cvRes.value.success) {
      myCv = cvRes.value.data;
      setCv(myCv);
    }
    if (jobRes.status === 'fulfilled' && jobRes.value.success) {
      setJobs(enrichJobsWithMatchScore(jobRes.value.data, myCv));
    }
    setLoading(false);
  };

  const loadJobs = async () => {
    const res = await jobService.getJobs(filter);
    if (res.success) {
      setJobs(enrichJobsWithMatchScore(res.data, cv));
    }
  };

  const openDetail = (job: Job) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    if (!cv) {
      message.warning('Bạn cần tạo CV trước khi ứng tuyển!');
      history.push('/student/cv');
      return;
    }
    setApplying(true);
    const res = await applicationService.apply(selectedJob.id).catch(() => null);
    setApplying(false);
    if (res?.success) {
      setAppliedIds((prev) => new Set(prev).add(selectedJob.id));
      message.success('Ứng tuyển thành công! Email xác nhận đã được gửi.');
    }
  };

  const matchScore = selectedJob && cv ? calcMatchScore(cv.skills, selectedJob.skills) : 0;
  const matchedSkills = selectedJob && cv ? getMatchedSkills(cv.skills, selectedJob.skills) : [];

  return (
    <div>
      <Title level={4}>Tìm việc & Thực tập</Title>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm vị trí, công ty..."
            style={{ width: 260 }}
            onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
            allowClear
          />
          <Select
            placeholder="Ngành nghề"
            style={{ width: 180 }}
            allowClear
            onChange={(v) => setFilter((f) => ({ ...f, industry: v }))}
          >
            {INDUSTRIES.map((i) => (
              <Option key={i.value} value={i.value}>{i.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="Loại hình"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilter((f) => ({ ...f, type: v }))}
          >
            {JOB_TYPES.map((t) => (
              <Option key={t.value} value={t.value}>{t.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="Hình thức"
            style={{ width: 140 }}
            allowClear
            onChange={(v) => setFilter((f) => ({ ...f, remote: v === 'remote' }))}
          >
            <Option value="remote">Remote OK</Option>
            <Option value="onsite">Onsite</Option>
          </Select>
        </Space>
      </Card>

      {!cv && (
        <Card style={{ marginBottom: 16, borderColor: '#378ADD' }}>
          <Text>
            💡 <strong>Tạo CV ngay</strong> để hệ thống gợi ý việc làm phù hợp với kỹ năng của bạn!{' '}
            <a onClick={() => history.push('/student/cv')}>Tạo CV →</a>
          </Text>
        </Card>
      )}

      <Spin spinning={loading}>
        {jobs.length === 0 ? (
          <Empty description="Không tìm thấy việc làm phù hợp" />
        ) : (
          <List
            dataSource={jobs}
            renderItem={(job) => (
              <JobCard
                key={job.id}
                job={job}
                applied={appliedIds.has(job.id)}
                onViewDetail={() => openDetail(job)}
              />
            )}
          />
        )}
      </Spin>

      {/* Job Detail Drawer */}
      <Drawer
        title={null}
        placement="right"
        width={620}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {selectedJob && (
          <div>
            {/* Header */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Space align="start">
                <Avatar
                  size={52}
                  style={{ background: '#E6F1FB', color: '#185FA5', fontSize: 20, flexShrink: 0 }}
                  icon={<BankOutlined />}
                >
                  {(selectedJob.company?.name ?? 'C')[0]}
                </Avatar>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{selectedJob.title}</Title>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    {selectedJob.company?.name ?? 'Công ty'} · <EnvironmentOutlined /> {selectedJob.location}
                    {selectedJob.remote && <Tag style={{ marginLeft: 8 }}>Remote OK</Tag>}
                  </Text>
                </div>
              </Space>

              <Space wrap style={{ marginTop: 12 }}>
                <Tag color="blue">{JOB_TYPE_LABELS[selectedJob.type] ?? selectedJob.type}</Tag>
                <Tag
                  icon={<ClockCircleOutlined />}
                  color={daysUntil(selectedJob.deadline) <= 3 ? 'red' : 'default'}
                >
                  Còn {daysUntil(selectedJob.deadline)} ngày · hạn {formatDate(selectedJob.deadline)}
                </Tag>
                {selectedJob.salaryMin && (
                  <Tag icon={<DollarOutlined />} color="green">
                    {formatCurrency(selectedJob.salaryMin)} – {formatCurrency(selectedJob.salaryMax ?? 0)}
                  </Tag>
                )}
              </Space>
            </div>

            {/* Match score + apply */}
            <div style={{ padding: '16px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <Row align="middle" gutter={16}>
                {cv && matchScore > 0 ? (
                  <Col flex="none">
                    <Space>
                      <Progress
                        type="circle"
                        percent={matchScore}
                        strokeColor={matchScore >= 80 ? '#0F6E56' : matchScore >= 60 ? '#EF9F27' : '#888'}
                        size={64}
                      />
                      <div>
                        <div><Text strong>Độ phù hợp CV</Text></div>
                        <Tag color={getMatchColor(matchScore)}>{getMatchLabel(matchScore)}</Tag>
                      </div>
                    </Space>
                  </Col>
                ) : !cv ? (
                  <Col flex="auto">
                    <Text type="secondary">⚠️ <a onClick={() => history.push('/student/cv')}>Tạo CV</a> để xem độ phù hợp</Text>
                  </Col>
                ) : null}
                <Col flex="auto" style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    size="large"
                    loading={applying}
                    disabled={appliedIds.has(selectedJob.id)}
                    onClick={handleApply}
                    icon={appliedIds.has(selectedJob.id) ? <CheckCircleOutlined /> : undefined}
                  >
                    {appliedIds.has(selectedJob.id) ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              {/* Thông tin chung */}
              <Descriptions column={2} size="small" style={{ marginBottom: 20 }}>
                <Descriptions.Item label="Ngành">{selectedJob.industry}</Descriptions.Item>
                <Descriptions.Item label="Loại hình">{JOB_TYPE_LABELS[selectedJob.type]}</Descriptions.Item>
                <Descriptions.Item label="Địa điểm">{selectedJob.location}</Descriptions.Item>
                <Descriptions.Item label="Làm từ xa">{selectedJob.remote ? 'Có' : 'Không'}</Descriptions.Item>
                <Descriptions.Item label="Đăng ngày">{formatDate(selectedJob.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="Hạn nộp">{formatDate(selectedJob.deadline)}</Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '0 0 16px' }} />

              {/* Mô tả */}
              <Title level={5} style={{ marginBottom: 8 }}>Mô tả công việc</Title>
              <Paragraph style={{ whiteSpace: 'pre-line', color: '#333' }}>{selectedJob.description}</Paragraph>

              {selectedJob.requirements && (
                <>
                  <Title level={5} style={{ marginBottom: 8, marginTop: 16 }}>Yêu cầu ứng viên</Title>
                  <Paragraph style={{ whiteSpace: 'pre-line', color: '#333' }}>{selectedJob.requirements}</Paragraph>
                </>
              )}

              <Divider style={{ margin: '16px 0' }} />

              {/* Kỹ năng */}
              <Title level={5} style={{ marginBottom: 10 }}>Kỹ năng yêu cầu</Title>
              <Space wrap>
                {selectedJob.skills.map((skill) => {
                  const isMatch = matchedSkills.includes(skill);
                  return (
                    <Tag
                      key={skill}
                      color={isMatch ? 'blue' : undefined}
                      icon={isMatch ? <CheckCircleOutlined /> : undefined}
                    >
                      {skill}
                    </Tag>
                  );
                })}
              </Space>
              {cv && matchedSkills.length > 0 && (
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  ✅ Bạn có <strong>{matchedSkills.length}/{selectedJob.skills.length}</strong> kỹ năng phù hợp
                </Text>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ─── JobCard component ───────────────────────────────────────────────── */
function JobCard({
  job,
  applied,
  onViewDetail,
}: {
  job: Job;
  applied: boolean;
  onViewDetail: () => void;
}) {
  const days = daysUntil(job.deadline);

  return (
    <Card
      style={{
        marginBottom: 12,
        borderLeft: (job.matchScore ?? 0) >= 80 ? '3px solid #185FA5' : undefined,
        cursor: 'pointer',
      }}
      hoverable
      onClick={onViewDetail}
    >
      <Row justify="space-between" align="top">
        <Col flex="auto">
          <Space direction="vertical" size={4}>
            <Space>
              <Title level={5} style={{ margin: 0, color: '#185FA5' }}>
                {job.title}
              </Title>
              {(job.matchScore ?? 0) > 0 && (
                <Tag color={getMatchColor(job.matchScore ?? 0)}>
                  {getMatchLabel(job.matchScore ?? 0)}
                </Tag>
              )}
            </Space>

            <Text type="secondary">
              {job.company?.name ?? 'Công ty'} · <EnvironmentOutlined /> {job.location}
              {job.remote && <Tag style={{ marginLeft: 6 }}>Remote OK</Tag>}
            </Text>

            <Space>
              {job.salaryMin && (
                <Text>
                  <DollarOutlined /> {formatCurrency(job.salaryMin)} – {formatCurrency(job.salaryMax ?? 0)}
                </Text>
              )}
              <Text type={days <= 3 ? 'danger' : 'secondary'}>
                <ClockCircleOutlined /> Còn {days} ngày
              </Text>
            </Space>

            <Space wrap>
              {job.skills.map((skill) => {
                const isMatched = job.matchedSkills?.includes(skill);
                return (
                  <Tag key={skill} color={isMatched ? 'blue' : undefined}>
                    {skill}
                  </Tag>
                );
              })}
            </Space>
          </Space>
        </Col>

        <Col onClick={(e) => e.stopPropagation()}>
          <Space direction="vertical" align="end">
            <Tag>{JOB_TYPE_LABELS[job.type] ?? job.type}</Tag>
            <Button
              type="primary"
              disabled={applied}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail();
              }}
            >
              {applied ? '✓ Đã ứng tuyển' : 'Xem chi tiết'}
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
