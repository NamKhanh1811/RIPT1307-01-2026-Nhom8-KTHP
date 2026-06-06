import {
  Row, Col, Card, Statistic, Typography, List, Tag, Space, Button,
  Grid,
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
const { useBreakpoint } = Grid;

export default function EmployerDashboard() {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allApps, setAllApps] = useState<Application[]>([]);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    jobService.getMyJobs().then(async (res) => {
      if (!res.success) return;
      const myJobs: Job[] = res.data;
      setJobs(myJobs);

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

  const recentApps = [...allApps]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 5);

  const statSpan = isMobile ? 12 : 6;
  const listColSpan = isMobile ? 24 : 12;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: 24,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
      }}>
        <div>
          <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
            Xin chào, {user?.fullName} 👋
          </Title>
          <Text type="secondary">Quản lý tin tuyển dụng và ứng viên của bạn</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => history.push('/employer/jobs')}
          style={isMobile ? { alignSelf: 'flex-start' } : undefined}
        >
          Đăng tin tuyển dụng
        </Button>
      </div>

      <Row gutter={[12, 12]}>
        <Col span={statSpan}>
          <Card bodyStyle={{ padding: isMobile ? '12px 16px' : undefined }}>
            <Statistic
              title="Tin đang tuyển"
              value={activeJobs}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#185FA5', fontSize: isMobile ? 22 : undefined }}
            />
          </Card>
        </Col>
        <Col span={statSpan}>
          <Card bodyStyle={{ padding: isMobile ? '12px 16px' : undefined }}>
            <Statistic
              title="Tổng ứng viên"
              value={totalApplicants}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: isMobile ? 22 : undefined }}
            />
          </Card>
        </Col>
        <Col span={statSpan}>
          <Card bodyStyle={{ padding: isMobile ? '12px 16px' : undefined }}>
            <Statistic
              title="Chờ duyệt"
              value={pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#854F0B', fontSize: isMobile ? 22 : undefined }}
            />
          </Card>
        </Col>
        <Col span={statSpan}>
          <Card bodyStyle={{ padding: isMobile ? '12px 16px' : undefined }}>
            <Statistic
              title="Đã duyệt"
              value={approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#0F6E56', fontSize: isMobile ? 22 : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col span={listColSpan}>
          <Card
            title="Tin tuyển dụng của tôi"
            extra={<a onClick={() => history.push('/employer/jobs')}>Quản lý →</a>}
          >
            <List
              dataSource={jobs.slice(0, 5)}
              locale={{ emptyText: 'Chưa có tin tuyển dụng' }}
              renderItem={(job) => {
                const s = JOB_STATUS[job.status as keyof typeof JOB_STATUS];
                return (
                  <List.Item
                    extra={<Tag color={s.color}>{s.label}</Tag>}
                    style={{ padding: isMobile ? '8px 0' : undefined }}
                  >
                    <List.Item.Meta
                      title={<span style={{ fontSize: isMobile ? 13 : undefined }}>{job.title}</span>}
                      description={`Đăng ${formatDate(job.createdAt)}`}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col span={listColSpan}>
          <Card
            title="Ứng viên gần đây"
            extra={<a onClick={() => history.push('/employer/candidates')}>Xem tất cả →</a>}
          >
            <List
              dataSource={recentApps}
              locale={{ emptyText: 'Chưa có ứng viên' }}
              renderItem={(app) => (
                <List.Item style={{ padding: isMobile ? '8px 0' : undefined }}>
                  <List.Item.Meta
                    title={
                      <span style={{ fontSize: isMobile ? 13 : undefined }}>
                        {app.user?.fullName ?? `Ứng viên #${app.userId}`}
                      </span>
                    }
                    description={
                      <Space size={4} wrap>
                        <Tag color={getMatchColor(app.matchScore)}>{app.matchScore}% phù hợp</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(app.appliedAt)}</Text>
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