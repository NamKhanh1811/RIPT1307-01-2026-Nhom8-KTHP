export const SKILLS_LIST = [
  'React', 'TypeScript', 'JavaScript', 'Vue', 'Angular', 'Next.js',
  'Node.js', 'Express', 'Java', 'Spring Boot', 'Python', 'Django', 'FastAPI',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'Git', 'CI/CD', 'REST API', 'GraphQL',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
  'Ant Design', 'Tailwind CSS', 'Figma', 'Photoshop',
  'Excel', 'Power BI', 'Tableau',
  'C', 'C++', 'C#', '.NET', 'PHP', 'Laravel',
];

export const INDUSTRIES = [
  { value: 'IT', label: 'IT / Phần mềm' },
  { value: 'MARKETING', label: 'Marketing / Truyền thông' },
  { value: 'BUSINESS', label: 'Kinh doanh / Sales' },
  { value: 'DESIGN', label: 'Thiết kế / Sáng tạo' },
  { value: 'ACCOUNTING', label: 'Kế toán / Tài chính' },
  { value: 'OTHER', label: 'Khác' },
];

export const JOB_TYPES = [
  { value: 'INTERNSHIP', label: 'Thực tập' },
  { value: 'FULL_TIME', label: 'Toàn thời gian' },
  { value: 'PART_TIME', label: 'Bán thời gian' },
];

export const APPLICATION_STATUS = {
  PENDING: { label: 'Chờ duyệt', color: 'orange' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Từ chối', color: 'red' },
};

export const JOB_STATUS = {
  PENDING: { label: 'Chờ duyệt', color: 'orange' },
  APPROVED: { label: 'Đang tuyển', color: 'green' },
  REJECTED: { label: 'Đã từ chối', color: 'red' },
  CLOSED: { label: 'Đã đóng', color: 'default' },
};

export const MATCH_SCORE_COLORS = {
  high: '#0F6E56',   // >= 80%
  medium: '#854F0B', // >= 60%
  low: '#5F5E5A',    // < 60%
};

export const API_BASE_URL = '/api';

export const ROLES = {
  STUDENT: 'STUDENT',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
} as const;
