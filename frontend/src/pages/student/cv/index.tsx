import {
  Card, Form, Input, Select, Button, Row, Col, Space, Tag, Typography,
  Divider, Upload, message, Spin, Modal, Grid,
} from 'antd';
import { PlusOutlined, UploadOutlined, SaveOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { cvService } from '@/services/cv';
import { SKILLS_LIST } from '@/constants';
import type { CvProfile, Experience, Education } from '@/types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getFullPdfUrl(pdfUrl: string): string {
  if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
    return pdfUrl;
  }
  return `${BACKEND_URL}${pdfUrl}`;
}

export default function CvBuilderPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
    return false;
  };

  if (loading) return <Spin />;

  const fullPdfUrl = pdfUrl ? getFullPdfUrl(pdfUrl) : null;

  const formContent = (
    <Form form={form} layout="vertical">
      <Card title="Thông tin cơ bản" style={{ marginBottom: 12 }}>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="headline" label="Vị trí ứng tuyển"
              rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
            >
              <Input placeholder="Frontend Developer Intern" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="university" label="Trường đại học">
              <Input placeholder="Đại học Bách Khoa Hà Nội" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="major" label="Chuyên ngành">
              <Input placeholder="Công nghệ thông tin" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="graduationYear" label="Năm TN">
              <Input type="number" placeholder="2026" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
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
                    <Col xs={24} sm={12}>
                      <Form.Item name={[name, 'company']} label="Công ty">
                        <Input placeholder="Tên công ty" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
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
  );

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>CV của tôi</Title>
        <Space wrap>
          <Upload accept=".pdf" beforeUpload={handleUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />} size={isMobile ? 'small' : 'middle'}>
              {isMobile ? 'Upload PDF' : 'Upload CV PDF'}
            </Button>
          </Upload>
          {isMobile && pdfUrl && (
            <Button icon={<FilePdfOutlined />} size="small" onClick={() => setPdfModalOpen(true)}>
              Xem PDF
            </Button>
          )}
          {isMobile && (
            <Button size="small" onClick={() => setPreviewOpen(true)}>
              Xem trước
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} onClick={onSave} loading={saving}
            size={isMobile ? 'small' : 'middle'}>
            Lưu CV
          </Button>
        </Space>
      </div>

      {isMobile ? (
        // On mobile: full-width form only, preview in a modal
        <div>{formContent}</div>
      ) : (
        // On desktop: side-by-side layout
        <Row gutter={16}>
          <Col span={14}>{formContent}</Col>
          <Col span={10}>
            <Card title="Xem trước CV" style={{ position: 'sticky', top: 16 }}>
              <CvPreview
                form={form}
                skills={selectedSkills}
                pdfUrl={pdfUrl}
                onViewPdf={() => setPdfModalOpen(true)}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Mobile: CV preview modal */}
      {isMobile && (
        <Modal
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          footer={null}
          title="Xem trước CV"
          width="95vw"
          style={{ top: 10 }}
        >
          <CvPreview
            form={form}
            skills={selectedSkills}
            pdfUrl={pdfUrl}
            onViewPdf={() => { setPreviewOpen(false); setPdfModalOpen(true); }}
          />
        </Modal>
      )}

      {/* PDF viewer modal */}
      <Modal
        open={pdfModalOpen}
        onCancel={() => setPdfModalOpen(false)}
        footer={null}
        title="CV PDF đã upload"
        width={isMobile ? '95vw' : '80vw'}
        style={isMobile ? { top: 10 } : undefined}
        styles={{ body: { padding: 0, height: isMobile ? '70vh' : '80vh' } }}
        destroyOnClose
      >
        {fullPdfUrl && (
          <iframe
            src={fullPdfUrl}
            style={{ width: '100%', height: '100%', border: 'none', minHeight: isMobile ? '65vh' : '75vh' }}
            title="CV PDF"
          />
        )}
      </Modal>
    </div>
  );
}

function CvPreview({ form, skills, pdfUrl, onViewPdf }: {
  form: any;
  skills: string[];
  pdfUrl: string | null;
  onViewPdf: () => void;
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
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            size="small"
            onClick={onViewPdf}
          >
            📄 Xem CV PDF đã upload
          </Button>
        </>
      )}
    </div>
  );
}