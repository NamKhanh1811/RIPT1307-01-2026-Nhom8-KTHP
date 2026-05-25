import { Row, Col, Card, Statistic, Typography, Table, Tag, Spin } from 'antd';
import {
  TeamOutlined, BankOutlined, FileTextOutlined, CheckCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import request from '@/services/request';
import type { AdminStats } from '@/types';

const { Title } = Typography;


function MiniBarChart({ data, labelKey, valueKey, color }: {
  data: any[];
  labelKey: string;
  valueKey: string;
  color: string;
}) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
      {data.map((item) => {
        const pct = max > 0 ? (item[valueKey] / max) * 100 : 0;
        return (
          <div key={item[labelKey]}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#444' }}>{item[valueKey]}</span>
            <div style={{ width: '100%', height: `${pct}%`, minHeight: 4,
              background: color, borderRadius: '3px 3px 0 0' }} />
            <span style={{ fontSize: 10, color: '#888', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
              {item[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}


function DonutChart({ data }: { data: { status: string; count: number }[] }) {
  const COLORS: Record<string, string> = {
    APPROVED: '#0F6E56', PENDING: '#EF9F27', REJECTED: '#F0997B',
  };
  const LABELS: Record<string, string> = {
    APPROVED: 'Đã duyệt', PENDING: 'Chờ duyệt', REJECTED: 'Từ chối',
  };
  const total = data.reduce((s, d) => s + d.count, 0);
  let cumulative = 0;

  const slices = data.map((d) => {
    const startAngle = cumulative;
    const angle = total > 0 ? (d.count / total) * 360 : 0;
    cumulative += angle;
    return { ...d, startAngle, angle };
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        {slices.map((slice, i) => {
          if (slice.angle === 0) return null;
          const start = polarToCartesian(60, 60, 45, slice.startAngle);
          const end = polarToCartesian(60, 60, 45, slice.startAngle + slice.angle);
          const large = slice.angle > 180 ? 1 : 0;
          return (
            <path key={i}
              d={`M60,60 L${start.x},${start.y} A45,45 0 ${large},1 ${end.x},${end.y} Z`}
              fill={COLORS[slice.status] ?? '#ccc'}
            />
          );
        })}
        <circle cx="60" cy="60" r="25" fill="white" />
        <text x="60" y="64" textAnchor="middle" fontSize="13" fontWeight="500" fill="#333">
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map((s) => (
          <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2,
              background: COLORS[s.status], display: 'inline-block' }} />
            <span style={{ color: '#555' }}>{LABELS[s.status] ?? s.status}</span>
            <span style={{ fontWeight: 500 }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request.get<never, any>('/admin/stats')
      .then((res) => { if (res.success) setStats(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  if (!stats) return null;

  return (
    <div>
      <Title level={4}>Tổng quan hệ thống</Title>

      {/* Stats cards */}
      <Row gutter={[16, 16]}>
        {[
          { title: 'Tin đang tuyển', value: stats.totalJobs, icon: <FileTextOutlined />, color: '#185FA5' },
          { title: 'Sinh viên', value: stats.totalStudents, icon: <TeamOutlined />, color: '#0F6E56' },
          { title: 'Doanh nghiệp', value: stats.totalEmployers, icon: <BankOutlined />, color: '#854F0B' },
          { title: 'Tổng ứng tuyển', value: stats.totalApplications, icon: <CheckCircleOutlined />, color: '#533AB7' },
        ].map((s) => (
          <Col span={6} key={s.title}>
            <Card>
              <Statistic title={s.title} value={s.value}
                prefix={s.icon} valueStyle={{ color: s.color }} />
              <div style={{ fontSize: 12, color: '#0F6E56', marginTop: 4 }}>
                <RiseOutlined /> Tỷ lệ thành công: {stats.successRate}%
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="Việc làm theo ngành nghề">
            <MiniBarChart
              data={stats.jobsByIndustry}
              labelKey="industry"
              valueKey="count"
              color="#378ADD"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Trạng thái ứng tuyển">
            <DonutChart data={stats.applicationsByStatus as any} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="Lượt ứng tuyển theo tháng">
            <MiniBarChart
              data={stats.monthlyApplications}
              labelKey="month"
              valueKey="count"
              color="#7F77DD"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="🔥 Kỹ năng hot nhất">
            <Table
              dataSource={stats.hotSkills}
              rowKey="skill"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Kỹ năng',
                  dataIndex: 'skill',
                  render: (s, _, i) => (
                    <Tag color={i < 3 ? 'orange' : 'blue'}>{i < 3 ? '🔥 ' : ''}{s}</Tag>
                  ),
                },
                {
                  title: 'Số CV',
                  dataIndex: 'count',
                  sorter: (a: any, b: any) => a.count - b.count,
                  defaultSortOrder: 'descend',
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
