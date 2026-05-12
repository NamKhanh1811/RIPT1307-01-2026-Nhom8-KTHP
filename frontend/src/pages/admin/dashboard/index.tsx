import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd';
import {
  TeamOutlined, BankOutlined, FileTextOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Column, Pie } from '@ant-design/charts';
import type { AdminStats } from '@/types';

const { Title } = Typography;

// Mock data - replace with API call
const mockStats: AdminStats = {
  totalJobs: 1248,
  totalStudents: 3872,
  totalEmployers: 284,
  totalApplications: 9421,
  successRate: 31,
  jobsByIndustry: [
    { industry: 'IT', count: 587 },
    { industry: 'Marketing', count: 234 },
    { industry: 'Kinh doanh', count: 198 },
    { industry: 'Thiết kế', count: 143 },
    { industry: 'Kế toán', count: 86 },
  ],
  applicationsByStatus: [
    { status: 'Đã duyệt', count: 4240 },
    { status: 'Chờ duyệt', count: 3203 },
    { status: 'Từ chối', count: 1978 },
  ],
  hotSkills: [
    { skill: 'React', count: 412 },
    { skill: 'AI/ML', count: 387 },
    { skill: 'Node.js', count: 341 },
    { skill: 'TypeScript', count: 298 },
    { skill: 'Spring Boot', count: 267 },
    { skill: 'Python', count: 245 },
    { skill: 'Docker', count: 198 },
  ],
  monthlyApplications: [
    { month: 'T1', count: 620 },
    { month: 'T2', count: 710 },
    { month: 'T3', count: 890 },
    { month: 'T4', count: 1050 },
    { month: 'T5', count: 1380 },
  ],
};

export default function AdminDashboard() {
  const [stats] = useState<AdminStats>(mockStats);

  return (
    <div>
      <Title level={4}>Tổng quan hệ thống</Title>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="Tổng việc làm" value={stats.totalJobs}
              prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Sinh viên" value={stats.totalStudents}
              prefix={<TeamOutlined />} valueStyle={{ color: '#185FA5' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Doanh nghiệp" value={stats.totalEmployers}
              prefix={<BankOutlined />} valueStyle={{ color: '#0F6E56' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Tổng ứng tuyển" value={stats.totalApplications}
              prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Việc làm theo ngành">
            <Column
              data={stats.jobsByIndustry}
              xField="industry"
              yField="count"
              color="#185FA5"
              label={{ position: 'top', style: { fill: '#666', fontSize: 12 } }}
              height={220}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Trạng thái ứng tuyển">
            <Pie
              data={stats.applicationsByStatus}
              angleField="count"
              colorField="status"
              radius={0.8}
              label={{ type: 'outer', content: '{name}: {percentage}' }}
              height={220}
              color={['#1D9E75', '#EF9F27', '#F0997B']}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="Lượt ứng tuyển theo tháng">
            <Column
              data={stats.monthlyApplications}
              xField="month"
              yField="count"
              color="#7F77DD"
              height={200}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="🔥 Kỹ năng hot nhất">
            <Table
              dataSource={stats.hotSkills}
              rowKey="skill"
              size="small"
              pagination={false}
              columns={[
                { title: 'Kỹ năng', dataIndex: 'skill', render: (s) => <Tag color="orange">{s}</Tag> },
                { title: 'Số lượng', dataIndex: 'count', sorter: (a, b) => a.count - b.count },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
