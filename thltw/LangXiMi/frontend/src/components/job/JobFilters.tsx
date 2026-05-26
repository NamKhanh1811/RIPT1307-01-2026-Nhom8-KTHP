import { Space, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { INDUSTRIES, JOB_TYPES } from '@/constants';
import type { JobFilter } from '@/types';

interface Props {
  value: JobFilter;
  onChange: (f: JobFilter) => void;
}

export default function JobFilters({ value, onChange }: Props) {
  const set = (key: keyof JobFilter, v: any) => onChange({ ...value, [key]: v || undefined });

  return (
    <Space wrap>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Tìm vị trí, công ty..."
        style={{ width: 260 }}
        value={value.keyword ?? ''}
        onChange={(e) => set('keyword', e.target.value)}
        allowClear
      />
      <Select
        placeholder="Ngành nghề"
        style={{ width: 180 }}
        value={value.industry}
        allowClear
        onChange={(v) => set('industry', v)}
        options={INDUSTRIES.map((i) => ({ label: i.label, value: i.value }))}
      />
      <Select
        placeholder="Loại hình"
        style={{ width: 150 }}
        value={value.type}
        allowClear
        onChange={(v) => set('type', v)}
        options={JOB_TYPES.map((t) => ({ label: t.label, value: t.value }))}
      />
      <Select
        placeholder="Hình thức"
        style={{ width: 140 }}
        value={value.remote !== undefined ? (value.remote ? 'remote' : 'onsite') : undefined}
        allowClear
        onChange={(v) => set('remote', v === 'remote' ? true : v === 'onsite' ? false : undefined)}
        options={[
          { label: 'Remote OK', value: 'remote' },
          { label: 'Onsite', value: 'onsite' },
        ]}
      />
    </Space>
  );
}
