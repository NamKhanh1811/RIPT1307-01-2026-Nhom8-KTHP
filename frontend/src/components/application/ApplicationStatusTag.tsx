import { Tag, Tooltip } from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import type { ApplicationStatus } from '@/types';

const CONFIG: Record<ApplicationStatus, { color: string; icon: React.ReactNode; label: string; tooltip: string }> = {
  PENDING: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    label: 'Chờ duyệt',
    tooltip: 'Nhà tuyển dụng đang xem xét hồ sơ của bạn',
  },
  APPROVED: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    label: 'Đã duyệt',
    tooltip: 'Chúc mừng! Hồ sơ của bạn đã được chấp nhận',
  },
  REJECTED: {
    color: 'red',
    icon: <CloseCircleOutlined />,
    label: 'Từ chối',
    tooltip: 'Hồ sơ chưa phù hợp lần này. Đừng nản lòng!',
  },
};

export default function ApplicationStatusTag({ status }: { status: ApplicationStatus }) {
  const cfg = CONFIG[status];
  return (
    <Tooltip title={cfg.tooltip}>
      <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
    </Tooltip>
  );
}
