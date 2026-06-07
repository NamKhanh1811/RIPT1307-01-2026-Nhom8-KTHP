import { Tag, Input, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { SKILLS_LIST } from '@/constants';

const { Text } = Typography;

interface Props {
  value: string[];
  onChange: (skills: string[]) => void;
  maxCount?: number;
}

export default function SkillPicker({ value = [], onChange, maxCount = 20 }: Props) {
  const [customInput, setCustomInput] = useState('');
  const [inputVisible, setInputVisible] = useState(false);

  const toggle = (skill: string) => {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else if (value.length < maxCount) {
      onChange([...value, skill]);
    }
  };

  const addCustom = () => {
    const s = customInput.trim();
    if (s && !value.includes(s) && value.length < maxCount) {
      onChange([...value, s]);
    }
    setCustomInput('');
    setInputVisible(false);
  };

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        Click để chọn · Đã chọn {value.length}/{maxCount}
      </Text>

      {/* Suggested skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {SKILLS_LIST.map((skill) => {
          const selected = value.includes(skill);
          return (
            <Tag
              key={skill}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              color={selected ? 'blue' : undefined}
              onClick={() => toggle(skill)}
            >
              {selected ? '✓ ' : ''}{skill}
            </Tag>
          );
        })}
      </div>

      {/* Add custom skill */}
      {inputVisible ? (
        <Space>
          <Input
            size="small"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onPressEnter={addCustom}
            onBlur={addCustom}
            placeholder="Nhập kỹ năng..."
            style={{ width: 160 }}
            autoFocus
          />
        </Space>
      ) : (
        <Tag
          icon={<PlusOutlined />}
          style={{ cursor: 'pointer', borderStyle: 'dashed' }}
          onClick={() => setInputVisible(true)}
        >
          Thêm kỹ năng khác
        </Tag>
      )}

      {/* Selected skills display */}
      {value.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ fontSize: 12 }}>Đã chọn: </Text>
          <Space wrap size={4}>
            {value.map((s) => (
              <Tag key={s} color="blue" closable onClose={() => toggle(s)}>{s}</Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
}
