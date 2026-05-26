import {
  Row, Col, Card, Input, Select, Tag, Button, Typography, Space,
  List, Badge, Empty, Spin,
} from 'antd';
import {
  SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { useEffect, useState } from 'react';
import { jobService } from '@/services/jobs';
import { cvService } from '@/services/cv';
import { enrichJobsWithMatchScore, getMatchColor, getMatchLabel } from '@/utils/matching';
import { formatCurrency, daysUntil } from '@/utils/helpers';
import { INDUSTRIES, JOB_TYPES, SKILLS_LIST } from '@/constants';
import type { Job, CvProfile, JobFilter } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cv, setCv] = useState<CvProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JobFilter>({});

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
              <JobCard key={job.id} job={job} cv={cv} />
            )}
          />
        )}
      </Spin>
    </div>
  );
}

function JobCard({ job, cv }: { job: Job; cv: CvProfile | null }) {
  const [applied, setApplied] = useState(false);
  const days = daysUntil(job.deadline);

  return (
    <Card
      style={{ marginBottom: 12, borderLeft: (job.matchScore ?? 0) >= 80 ? '3px solid #185FA5' : undefined }}
      hoverable
    >
      <Row justify="space-between" align="top">
        <Col flex="auto">
          <Space direction="vertical" size={4}>
            <Space>
              <Title level={5} style={{ margin: 0 }}>
                <a onClick={() => history.push(`/student/jobs/${job.id}`)}>{job.title}</a>
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

            {/* Skills với highlight matched */}
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

        <Col>
          <Space direction="vertical" align="end">
            <Tag>{job.type === 'INTERNSHIP' ? 'Thực tập' : job.type === 'FULL_TIME' ? 'Full-time' : 'Part-time'}</Tag>
            <Button
              type="primary"
              disabled={applied}
              onClick={() => setApplied(true)}
            >
              {applied ? '✓ Đã ứng tuyển' : 'Ứng tuyển ngay'}
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
