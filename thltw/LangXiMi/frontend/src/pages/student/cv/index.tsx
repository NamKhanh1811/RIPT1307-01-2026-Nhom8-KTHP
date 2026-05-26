import {
  Card, Form, Input, Select, Button, Row, Col, Space, Tag, Typography,
  Divider, Upload, message, Spin,
} from 'antd';
import { PlusOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { cvService } from '@/services/cv';
import { SKILLS_LIST } from '@/constants';
import type { CvProfile, Experience, Education } from '@/types';

const { Title, Text } = Typography;

export default function CvBuilderPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    loadCv();
  }, []);

  const loadCv = async () => {
    setLoading(true);
    const res = await cvService.getMyCv().catch(() => null);
    if (res?.success) {
      const cv = res.data;
      form.setFieldsValue(cv);
      setSelectedSkills(cv.skills ?? []);
      setPdfUrl(cv.pdfUrl ?? null);
    }
    setLoading(false);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload: Partial<CvProfile> = { ...values, skills: selectedSkills };
      const res = await cvService.saveCv(payload);
      if (res.success) message.success('Lưu CV thành công!');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    const res = await cvService.uploadPdf(file);
    if (res.success) {
      setPdfUrl(res.data.url);
      message.success('Upload CV PDF thành công!');
    }
    return false; // prevent auto upload
  };

  if (loading) return <Spin />;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>CV của tôi</Title>
        <Space>
          <Upload
            accept=".pdf"
            beforeUpload={handleUpload}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Upload CV PDF</Button>
          </Upload>
          <Button type="primary" icon={<SaveOutlined />} onClick={onSave} loading={saving}>
            Lưu CV
          </Button>
        </Space>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Form form={form} layout="vertical">
            <Card title="Thông tin cơ bản" style={{ marginBottom: 12 }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="headline" label="Vị trí ứng tuyển"
                    rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
                  >
                    <Input placeholder="Frontend Developer Intern" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="university" label="Trường đại học">
                    <Input placeholder="Đại học Bách Khoa Hà Nội" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="major" label="Chuyên ngành">
                    <Input placeholder="Công nghệ thông tin" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="graduationYear" label="Năm tốt nghiệp">
                    <Input type="number" placeholder="2026" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="gpa" label="GPA">
                    <Input type="number" placeholder="3.5" step="0.1" max={4} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="summary" label="Giới thiệu bản thân">
                    <Input.TextArea rows={3} placeholder="Mô tả ngắn về bản thân..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Kỹ năng" style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                Chọn kỹ năng của bạn (hệ thống sẽ dùng để match với job)
              </Text>
              <Space wrap>
                {SKILLS_LIST.map((skill) => (
                  <Tag
                    key={skill}
                    color={selectedSkills.includes(skill) ? 'blue' : undefined}
                    style={{ cursor: 'pointer', marginBottom: 4 }}
                    onClick={() => toggleSkill(skill)}
                  >
                    {selectedSkills.includes(skill) ? '✓ ' : '+ '}
                    {skill}
                  </Tag>
                ))}
              </Space>
              <Divider />
              <Text strong>Đã chọn: </Text>
              <Space wrap>
                {selectedSkills.map((s) => (
                  <Tag key={s} color="blue" closable onClose={() => toggleSkill(s)}>{s}</Tag>
                ))}
              </Space>
            </Card>

            <Card title="Kinh nghiệm làm việc" style={{ marginBottom: 12 }}>
              <Form.List name="experiences">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name }) => (
                      <Card key={key} size="small" style={{ marginBottom: 8 }}
                        extra={<a onClick={() => remove(name)}>Xóa</a>}
                      >
                        <Row gutter={8}>
                          <Col span={12}>
                            <Form.Item name={[name, 'company']} label="Công ty">
                              <Input placeholder="Tên công ty" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name={[name, 'position']} label="Vị trí">
                              <Input placeholder="Frontend Developer" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item name={[name, 'description']} label="Mô tả">
                              <Input.TextArea rows={2} placeholder="Mô tả công việc..." />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={() => add()} block type="dashed">
                      Thêm kinh nghiệm
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>
          </Form>
        </Col>

        <Col span={10}>
          <Card title="Xem trước CV" style={{ position: 'sticky', top: 16 }}>
            <CvPreview
              form={form}
              skills={selectedSkills}
              pdfUrl={pdfUrl}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function CvPreview({ form, skills, pdfUrl }: {
  form: any;
  skills: string[];
  pdfUrl: string | null;
}) {
  const values = form.getFieldsValue();
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 8 }}>
        <Title level={5} style={{ margin: 0 }}>{values.headline || 'Vị trí ứng tuyển'}</Title>
        <Text type="secondary">{values.university} {values.major && `· ${values.major}`}</Text>
      </div>

      {values.summary && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Text>{values.summary}</Text>
        </>
      )}

      <Divider style={{ margin: '8px 0' }} />
      <Text strong>Kỹ năng</Text>
      <div style={{ marginTop: 6 }}>
        <Space wrap size={4}>
          {skills.map((s) => <Tag key={s} color="blue">{s}</Tag>)}
        </Space>
      </div>

      {pdfUrl && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Button type="link" href={pdfUrl} target="_blank" size="small">
            📄 Xem CV PDF đã upload
          </Button>
        </>
      )}
    </div>
  );
}
