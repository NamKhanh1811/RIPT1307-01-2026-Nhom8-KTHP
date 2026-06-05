import { Row, Col, Card, Statistic, Typography, Table, Tag, Spin } from 'antd';
import {
  TeamOutlined, BankOutlined, FileTextOutlined, CheckCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import request from '@/services/request';
import { INDUSTRIES } from '@/constants';
import type { AdminStats } from '@/types';

const { Title } = Typography;

// Map industry value → label từ constants (dùng chung 1 nguồn sự thật)
const INDUSTRY_LABEL: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.value, i.label]),
);

const BAR_HEIGHT = 100; // px — chiều cao tối đa của bar

function MiniBarChart({ data, labelKey, valueKey, color, labelMap }: {
  data: any[];
  labelKey: string;
  valueKey: string;
  color: string;
  labelMap?: Record<string, string>;
}) {
  if (!data?.length) return <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Không có dữ liệu</div>;
  const max = Math.max(...data.map((d) => Number(d[valueKey])));
  return (
    // alignItems: flex-end để các bar cao thấp khác nhau đều căn dưới
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: BAR_HEIGHT + 40 }}>
      {data.map((item) => {
        const val = Number(item[valueKey]);
        // Tính chiều cao bar theo px, không dùng % tránh flex layout bug
        const barH = max > 0 ? Math.max((val / max) * BAR_HEIGHT, val > 0 ? 4 : 0) : 0;
        const rawLabel = item[labelKey];
        const label = labelMap?.[rawLabel] ?? rawLabel;
        return (
          <div key={rawLabel}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#444' }}>{val}</span>
            <div style={{
              width: '100%',
              height: barH,
              background: color,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.3s ease',
            }} />
            <span style={{
              fontSize: 10, color: '#888', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              width: '100%', textAlign: 'center', marginTop: 2,
            }} title={label}>
              {label}
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

  // Coerce count về number — mysql2 trả BigInt hoặc string
  const normalized = (data ?? []).map((d) => ({ ...d, count: Number(d.count) }));
  const total = normalized.reduce((s, d) => s + d.count, 0);

  if (!total) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Chưa có ứng tuyển</div>
  );

  let cumulative = 0;
  const slices = normalized.map((d) => {
    const startAngle = cumulative;
    const angle = (d.count / total) * 360;
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
          if (slice.angle < 0.1) return null;
          // Nếu chỉ có 1 slice (360°) — vẽ hình tròn thay vì path (path bị degenerate)
          if (slice.angle >= 359.9) {
            return <circle key={i} cx="60" cy="60" r="45" fill={COLORS[slice.status] ?? '#ccc'} />;
          }
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
              background: COLORS[s.status] ?? '#ccc', display: 'inline-block' }} />
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

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="Tin đang tuyển" value={stats.totalJobs}
              prefix={<FileTextOutlined />} valueStyle={{ color: '#185FA5' }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Tháng này: +{stats.newJobsThisMonth}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Sinh viên" value={stats.totalStudents}
              prefix={<TeamOutlined />} valueStyle={{ color: '#0F6E56' }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Tháng này: +{stats.newUsersThisMonth}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Doanh nghiệp" value={stats.totalEmployers}
              prefix={<BankOutlined />} valueStyle={{ color: '#854F0B' }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Đã xác minh: {stats.totalCompanies}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Tổng ứng tuyển" value={stats.totalApplications}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#533AB7' }} />
            <div style={{ fontSize: 12, color: '#0F6E56', marginTop: 4 }}>
              <RiseOutlined /> Tỷ lệ thành công: {stats.successRate}%
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="Việc làm theo ngành nghề">
            <MiniBarChart
              data={stats.jobsByIndustry}
              labelKey="industry"
              valueKey="count"
              color="#378ADD"
              labelMap={INDUSTRY_LABEL}
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
                  render: (v) => Number(v),
                  sorter: (a: any, b: any) => Number(a.count) - Number(b.count),
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
