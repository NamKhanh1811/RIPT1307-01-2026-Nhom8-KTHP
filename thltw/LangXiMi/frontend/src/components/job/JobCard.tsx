import { Card, Tag, Button, Typography, Space, Avatar } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { getMatchColor, getMatchLabel } from '@/utils/matching';
import { formatCurrency, daysUntil } from '@/utils/helpers';
import type { Job } from '@/types';

const { Text, Title } = Typography;

const JOB_TYPE_LABELS: Record<string, string> = {
  INTERNSHIP: 'Thực tập',
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
};

interface Props {
  job: Job;
  onApply?: (jobId: number) => void;
  applied?: boolean;
  showMatchScore?: boolean;
}

export default function JobCard({ job, onApply, applied = false, showMatchScore = true }: Props) {
  const days = daysUntil(job.deadline);
  const score = job.matchScore ?? 0;

  return (
    <Card
      hoverable
      style={{
        marginBottom: 12,
        borderLeft: score >= 80 ? '3px solid #185FA5' : undefined,
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Company logo */}
        <Avatar size={44} style={{ background: '#E6F1FB', color: '#185FA5', fontWeight: 600, flexShrink: 0 }}>
          {(job.company?.name ?? 'C')[0].toUpperCase()}
        </Avatar>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                <a onClick={() => history.push(`/student/jobs/${job.id}`)} style={{ color: 'inherit' }}>
                  {job.title}
                </a>
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {job.company?.name} &nbsp;·&nbsp;
                <EnvironmentOutlined /> {job.location}
                {job.remote && <Tag color="cyan" style={{ marginLeft: 6, fontSize: 11 }}>Remote OK</Tag>}
              </Text>
            </div>

            {/* Match score badge */}
            {showMatchScore && score > 0 && (
              <Tag color={getMatchColor(score)} style={{ flexShrink: 0 }}>
                {getMatchLabel(score)}
              </Tag>
            )}
          </div>

          {/* Meta row */}
          <Space wrap style={{ marginTop: 8, fontSize: 12 }}>
            <Tag>{JOB_TYPE_LABELS[job.type] ?? job.type}</Tag>
            {job.salaryMin && (
              <Text style={{ fontSize: 12, color: '#0F6E56' }}>
                <DollarOutlined /> {formatCurrency(job.salaryMin)}
                {job.salaryMax ? ` – ${formatCurrency(job.salaryMax)}` : '+'}
              </Text>
            )}
            <Text type={days <= 3 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              <ClockCircleOutlined /> Còn {days} ngày
            </Text>
          </Space>

          {/* Skills */}
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between', alignItems: 'center' }}>
            <Space wrap size={4}>
              {job.skills?.slice(0, 5).map((skill) => {
                const isMatched = job.matchedSkills?.includes(skill);
                return (
                  <Tag key={skill} color={isMatched ? 'blue' : undefined}
                    icon={isMatched ? <CheckCircleOutlined /> : undefined}
                    style={{ fontSize: 11 }}>
                    {skill}
                  </Tag>
                );
              })}
              {(job.skills?.length ?? 0) > 5 && (
                <Text type="secondary" style={{ fontSize: 11 }}>+{job.skills.length - 5}</Text>
              )}
            </Space>

            {onApply && (
              <Button
                type={applied ? 'default' : 'primary'}
                size="small"
                disabled={applied}
                onClick={() => onApply(job.id)}
                icon={applied ? <CheckCircleOutlined /> : undefined}
              >
                {applied ? 'Đã ứng tuyển' : 'Ứng tuyển'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
