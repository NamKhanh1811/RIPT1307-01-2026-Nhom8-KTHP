import { Row, Col, Card, Statistic, Tag, Typography, List, Progress } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { useEffect, useState } from 'react';
import { applicationService } from '@/services/applications';
import { jobService } from '@/services/jobs';
import { cvService } from '@/services/cv';
import { enrichJobsWithMatchScore, getMatchColor, getMatchLabel } from '@/utils/matching';
import { formatDate } from '@/utils/helpers';
import type { Application, Job, CvProfile } from '@/types';

const { Title, Text } = Typography;

export default function StudentDashboard() {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;

  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [cv, setCv] = useState<CvProfile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [appRes, jobRes, cvRes] = await Promise.allSettled([
      applicationService.getMyApplications(),
      jobService.getJobs({ page: 1, pageSize: 20 }),
      cvService.getMyCv(),
    ]);

    let myCv: CvProfile | null = null;
    if (cvRes.status === 'fulfilled' && cvRes.value.success) {
      myCv = cvRes.value.data;
      setCv(myCv);
    }

    if (appRes.status === 'fulfilled' && appRes.value.success) {
      setApplications(appRes.value.data);
    }

    if (jobRes.status === 'fulfilled' && jobRes.value.success) {
      const enriched = enrichJobsWithMatchScore(jobRes.value.data, myCv);
      setRecommendedJobs(enriched.slice(0, 5));
    }
  };

  const approved = applications.filter((a) => a.status === 'APPROVED').length;
  const pending = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <div>
      <Title level={4}>Xin chào, {user?.fullName} 👋</Title>
      <Text type="secondary">Đây là tổng quan hồ sơ và ứng tuyển của bạn</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Đã ứng tuyển"
              value={applications.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Đã được duyệt"
              value={approved}
              valueStyle={{ color: '#0F6E56' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Chờ phản hồi"
              value={pending}
              valueStyle={{ color: '#854F0B' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Kỹ năng trong CV"
              value={cv?.skills.length ?? 0}
              prefix={<SearchOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={14}>
          <Card title="🎯 Việc làm phù hợp với bạn" extra={<a href="/student/jobs">Xem tất cả</a>}>
            <List
              dataSource={recommendedJobs}
              renderItem={(job) => (
                <List.Item
                  extra={
                    <Tag color={getMatchColor(job.matchScore ?? 0)}>
                      {getMatchLabel(job.matchScore ?? 0)}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={<a href={`/student/jobs/${job.id}`}>{job.title}</a>}
                    description={`${job.company?.name ?? ''} · ${job.location}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="📋 Ứng tuyển gần đây">
            <List
              dataSource={applications.slice(0, 5)}
              renderItem={(app) => (
                <List.Item>
                  <List.Item.Meta
                    title={app.job?.title ?? `Job #${app.jobId}`}
                    description={formatDate(app.appliedAt)}
                  />
                  <Tag
                    color={
                      app.status === 'APPROVED'
                        ? 'green'
                        : app.status === 'REJECTED'
                        ? 'red'
                        : 'orange'
                    }
                  >
                    {app.status === 'APPROVED'
                      ? 'Đã duyệt'
                      : app.status === 'REJECTED'
                      ? 'Từ chối'
                      : 'Chờ duyệt'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
