import { Tag, Progress, Tooltip } from 'antd';
import { getMatchColor, getMatchLabel } from '@/utils/matching';

interface Props {
  score: number;
  showProgress?: boolean;
  matchedCount?: number;
  totalCount?: number;
}

export default function MatchScoreBadge({ score, showProgress, matchedCount, totalCount }: Props) {
  const color = getMatchColor(score);
  const label = getMatchLabel(score);

  return (
    <Tooltip title={
      matchedCount !== undefined
        ? `${matchedCount}/${totalCount} kỹ năng phù hợp`
        : `Match score: ${score}%`
    }>
      <div>
        <Tag color={color}>{label}</Tag>
        {showProgress && (
          <Progress
            percent={score}
            size="small"
            showInfo={false}
            strokeColor={score >= 80 ? '#0F6E56' : score >= 60 ? '#EF9F27' : '#888'}
            style={{ marginTop: 4, width: 80 }}
          />
        )}
      </div>
    </Tooltip>
  );
}
