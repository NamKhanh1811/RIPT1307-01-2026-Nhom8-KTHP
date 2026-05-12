// ========== USER & AUTH ==========
export type UserRole = 'STUDENT' | 'EMPLOYER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// ========== COMPANY ==========
export interface Company {
  id: number;
  userId: number;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  industry: string;
  verified: boolean;
  createdAt: string;
}

// ========== JOB ==========
export type JobType = 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME';
export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
export type Industry =
  | 'IT'
  | 'MARKETING'
  | 'BUSINESS'
  | 'DESIGN'
  | 'ACCOUNTING'
  | 'OTHER';

export interface Job {
  id: number;
  companyId: number;
  company?: Company;
  title: string;
  description: string;
  requirements: string;
  industry: Industry;
  type: JobType;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  remote: boolean;
  skills: string[];
  deadline: string;
  status: JobStatus;
  createdAt: string;
  // Computed by matching engine
  matchScore?: number;
  matchedSkills?: string[];
}

export interface JobFilter {
  keyword?: string;
  industry?: Industry;
  type?: JobType;
  location?: string;
  remote?: boolean;
}

// ========== CV ==========
export interface CvProfile {
  id: number;
  userId: number;
  headline: string;
  summary?: string;
  gpa?: number;
  university?: string;
  major?: string;
  graduationYear?: number;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  pdfUrl?: string;
  updatedAt: string;
}

export interface Experience {
  id?: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Education {
  id?: number;
  school: string;
  major: string;
  degree: string;
  startYear: number;
  endYear?: number;
}

// ========== APPLICATION ==========
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Application {
  id: number;
  userId: number;
  jobId: number;
  job?: Job;
  user?: User;
  cvProfile?: CvProfile;
  matchScore: number;
  status: ApplicationStatus;
  employerNote?: string;
  appliedAt: string;
  updatedAt: string;
}

// ========== NOTIFICATION ==========
export interface Notification {
  id: number;
  userId: number;
  type: 'APPLY_SUCCESS' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'NEW_APPLICANT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ========== DASHBOARD STATS ==========
export interface AdminStats {
  totalJobs: number;
  totalStudents: number;
  totalEmployers: number;
  totalApplications: number;
  successRate: number;
  jobsByIndustry: { industry: string; count: number }[];
  applicationsByStatus: { status: string; count: number }[];
  hotSkills: { skill: string; count: number }[];
  monthlyApplications: { month: string; count: number }[];
}

// ========== API RESPONSE ==========
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
