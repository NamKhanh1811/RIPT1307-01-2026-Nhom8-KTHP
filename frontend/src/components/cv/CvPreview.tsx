import { Tag, Typography, Divider, Button } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import type { CvProfile } from '@/types';

const { Title, Text } = Typography;

interface Props {
  cv: Partial<CvProfile>;
  pdfUrl?: string | null;
}

export default function CvPreview({ cv, pdfUrl }: Props) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: 20, fontSize: 13 }}>
      {/* Header */}
      <Title level={5} style={{ margin: 0, color: '#1a1a1a' }}>
        {cv.headline || <Text type="secondary">Vị trí ứng tuyển</Text>}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {cv.university}{cv.major ? ` · ${cv.major}` : ''}
        {cv.gpa ? ` · GPA ${cv.gpa}` : ''}
        {cv.graduationYear ? ` · K${cv.graduationYear}` : ''}
      </Text>

      {cv.summary && (
        <>
          <Divider style={{ margin: '10px 0' }} />
          <Text style={{ fontSize: 12, color: '#555' }}>{cv.summary}</Text>
        </>
      )}

      {/* Skills */}
      {(cv.skills?.length ?? 0) > 0 && (
        <>
          <Divider style={{ margin: '10px 0' }} />
          <Text strong style={{ fontSize: 12, color: '#185FA5', display: 'block', marginBottom: 6 }}>
            KỸ NĂNG
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {cv.skills?.map((s) => (
              <Tag key={s} color="blue" style={{ fontSize: 11 }}>{s}</Tag>
            ))}
          </div>
        </>
      )}

      {/* Experience */}
      {(cv.experiences?.length ?? 0) > 0 && (
        <>
          <Divider style={{ margin: '10px 0' }} />
          <Text strong style={{ fontSize: 12, color: '#185FA5', display: 'block', marginBottom: 6 }}>
            KINH NGHIỆM
          </Text>
          {cv.experiences?.map((exp, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 12 }}>{exp.position}</Text>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{exp.company}</Text>
              {exp.description && <Text style={{ fontSize: 11, color: '#666' }}>{exp.description}</Text>}
            </div>
          ))}
        </>
      )}

      {/* PDF link */}
      {pdfUrl && (
        <>
          <Divider style={{ margin: '10px 0' }} />
          <Button type="link" size="small" icon={<FilePdfOutlined />}
            href={pdfUrl} target="_blank" style={{ padding: 0, fontSize: 12 }}>
            Xem CV PDF đã upload
          </Button>
        </>
      )}
    </div>
  );
}
