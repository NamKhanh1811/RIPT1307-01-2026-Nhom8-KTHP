import { Empty, Button } from 'antd';

interface Props {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ description, actionLabel, onAction }: Props) {
  return (
    <Empty
      description={description ?? 'Không có dữ liệu'}
      style={{ padding: '40px 0' }}
    >
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </Empty>
  );
}
