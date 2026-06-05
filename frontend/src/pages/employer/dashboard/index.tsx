import {
  Row, Col, Card, Statistic, Typography, List, Tag, Space, Button, Progress,
} from 'antd';
import {
  FileTextOutlined, TeamOutlined, CheckCircleOutlined,
  ClockCircleOutlined, PlusOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { useEffect, useState } from 'react';
import { jobService } from '@/services/jobs';
import { applicationService } from '@/services/applications';
import { getMatchColor } from '@/utils/matching';
import { formatDate } from '@/utils/helpers';
import { JOB_STATUS } from '@/constants';
import type { Job, Application } from '@/types';

const { Title, Text } = Typography;

export default function EmployerDashboard() {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allApps, setAllApps] = useState<Application[]>([]);

  useEffect(() => {
    jobService.getMyJobs().then(async (res) => {
      if (!res.success) return;
      const myJobs: Job[] = res.data;
      setJobs(myJobs);

      // Fetch ứng viên của TẤT CẢ jobs song song
      const approvedJobs = myJobs.filter((j) => j.status === 'APPROVED');
      if (!approvedJobs.length) return;

      const results = await Promise.all(
        approvedJobs.map((j) =>
          applicationService.getApplicationsByJob(j.id).catch(() => null),
        ),
      );

      const combined: Application[] = results
        .filter((r) => r?.success)
        .flatMap((r) => r!.data);

      setAllApps(combined);
    });
  }, []);

  const totalApplicants = allApps.length;
  const pending  = allApps.filter((a) => a.status === 'PENDING').length;
  const approved = allApps.filter((a) => a.status === 'APPROVED').length;
  const activeJobs = jobs.filter((j) => j.status === 'APPROVED').length;

  // 5 ứng viên gần nhất (sort theo appliedAt DESC)
  const recentApps = [...allApps]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Xin chào, {user?.fullName} 👋</Title>
          <Text type="secondary">Quản lý tin tuyển dụng và ứng viên của bạn</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => history.push('/employer/jobs')}>
          Đăng tin tuyển dụng
        </Button>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="Tin đang tuyển" value={activeJobs}
              prefix={<FileTextOutlined />} valueStyle={{ color: '#185FA5' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Tổng ứng viên" value={totalApplicants}
              prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Chờ duyệt" value={pending}
              prefix={<ClockCircleOutlined />} valueStyle={{ color: '#854F0B' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Đã duyệt" value={approved}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#0F6E56' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Tin tuyển dụng của tôi" extra={
            <a onClick={() => history.push('/employer/jobs')}>Quản lý →</a>
          }>
            <List
              dataSource={jobs.slice(0, 5)}
              locale={{ emptyText: 'Chưa có tin tuyển dụng' }}
              renderItem={(job) => {
                const s = JOB_STATUS[job.status as keyof typeof JOB_STATUS];
                return (
                  <List.Item extra={<Tag color={s.color}>{s.label}</Tag>}>
                    <List.Item.Meta
                      title={job.title}
                      description={`Đăng ${formatDate(job.createdAt)}`}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Ứng viên gần đây" extra={
            <a onClick={() => history.push('/employer/candidates')}>Xem tất cả →</a>
          }>
            <List
              dataSource={recentApps}
              locale={{ emptyText: 'Chưa có ứng viên' }}
              renderItem={(app) => (
                <List.Item>
                  <List.Item.Meta
                    title={app.user?.fullName ?? `Ứng viên #${app.userId}`}
                    description={
                      <Space>
                        <Tag color={getMatchColor(app.matchScore)}>{app.matchScore}% phù hợp</Tag>
                        <Text type="secondary">{formatDate(app.appliedAt)}</Text>
                      </Space>
                    }
                  />
                  <Tag color={app.status === 'APPROVED' ? 'green' : app.status === 'REJECTED' ? 'red' : 'orange'}>
                    {app.status === 'APPROVED' ? 'Đã duyệt' : app.status === 'REJECTED' ? 'Từ chối' : 'Chờ'}
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
