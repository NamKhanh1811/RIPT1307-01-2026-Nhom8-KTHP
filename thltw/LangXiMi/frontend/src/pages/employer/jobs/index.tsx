import {
  Card, Table, Button, Modal, Form, Input, Select, DatePicker,
  Space, Tag, Typography, Switch, InputNumber, message, Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { jobService } from '@/services/jobs';
import { INDUSTRIES, JOB_TYPES, SKILLS_LIST, JOB_STATUS } from '@/constants';
import { formatDate, formatCurrency } from '@/utils/helpers';
import type { Job } from '@/types';

const { Title } = Typography;
const { TextArea } = Input;

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    const res = await jobService.getMyJobs();
    if (res.success) setJobs(res.data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    form.setFieldsValue({
      ...job,
      deadline: job.deadline ? dayjs(job.deadline) : undefined,
    });
    setModalOpen(true);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        deadline: values.deadline?.format('YYYY-MM-DD'),
        salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
      };
      let res;
      if (editing) {
        res = await jobService.updateJob(editing.id, payload);
      } else {
        res = await jobService.createJob(payload);
      }
      if (res.success) {
        message.success(editing ? 'Cập nhật tin thành công!' : 'Đăng tin thành công! Đang chờ admin duyệt.');
        setModalOpen(false);
        loadJobs();
      }
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors?.length) {
        serverErrors.forEach((e: { field: string; message: string }) => {
          message.error(`${e.field}: ${e.message}`);
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    const res = await jobService.deleteJob(id);
    if (res.success) {
      message.success('Đã xóa tin tuyển dụng');
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  };

  const columns: ColumnsType<Job> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      render: (title) => <strong>{title}</strong>,
    },
    {
      title: 'Ngành',
      dataIndex: 'industry',
      render: (v) => INDUSTRIES.find((i) => i.value === v)?.label ?? v,
    },
    {
      title: 'Loại hình',
      dataIndex: 'type',
      render: (v) => JOB_TYPES.find((t) => t.value === v)?.label ?? v,
    },
    {
      title: 'Lương',
      render: (_, r) =>
        r.salaryMin ? `${formatCurrency(r.salaryMin)} – ${formatCurrency(r.salaryMax ?? 0)}` : '—',
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'deadline',
      render: formatDate,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => {
        const s = JOB_STATUS[status as keyof typeof JOB_STATUS];
        return <Tag color={s?.color}>{s?.label ?? status}</Tag>;
      },
    },
    {
      title: 'Hành động',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Xóa tin này?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Quản lý tin tuyển dụng</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Đăng tin mới
        </Button>
      </Space>

      <Card>
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}
        open={modalOpen}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        width={720}
        okText={editing ? 'Cập nhật' : 'Đăng tin'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Tiêu đề vị trí"
            rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Frontend Developer Intern" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả công việc"
            rules={[{ required: true, message: 'Nhập mô tả' }]}>
            <TextArea rows={4} placeholder="Mô tả chi tiết công việc..." />
          </Form.Item>

          <Form.Item name="requirements" label="Yêu cầu ứng viên">
            <TextArea rows={3} placeholder="Kỹ năng, kinh nghiệm cần có..." />
          </Form.Item>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="industry" label="Ngành nghề" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn ngành' }]}>
              <Select placeholder="Chọn ngành">
                {INDUSTRIES.map((i) => <Select.Option key={i.value} value={i.value}>{i.label}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="type" label="Loại hình" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn loại hình' }]}>
              <Select placeholder="Chọn loại hình">
                {JOB_TYPES.map((t) => <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>)}
              </Select>
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="salaryMin" label="Lương tối thiểu (VNĐ)" style={{ flex: 1 }}>
              <InputNumber<number> style={{ width: '100%' }} placeholder="5000000" min={0} step={500000}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v?.replace(/,/g, '') ?? 0)} />
            </Form.Item>
            <Form.Item name="salaryMax" label="Lương tối đa (VNĐ)" style={{ flex: 1 }}>
              <InputNumber<number> style={{ width: '100%' }} placeholder="10000000" min={0} step={500000}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v?.replace(/,/g, '') ?? 0)} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="location" label="Địa điểm" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Nhập địa điểm' }]}>
              <Input placeholder="Hà Nội / TP. HCM / Đà Nẵng..." />
            </Form.Item>
            <Form.Item name="deadline" label="Hạn nộp" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn hạn nộp' }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Space>

          <Form.Item name="skills" label="Kỹ năng yêu cầu"
            rules={[{ required: true, message: 'Chọn ít nhất 1 kỹ năng' }]}>
            <Select mode="multiple" placeholder="Chọn kỹ năng..." allowClear>
              {SKILLS_LIST.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="remote" label="Cho phép làm việc từ xa" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}