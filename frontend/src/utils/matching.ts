import type { Job, CvProfile } from '@/types';

/**
 * Job Matching Engine
 * Tính % kỹ năng trùng giữa CV của sinh viên và yêu cầu job
 */
export function calcMatchScore(cvSkills: string[], jobSkills: string[]): number {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!cvSkills || cvSkills.length === 0) return 0;

  const cvSkillsLower = cvSkills.map((s) => s.toLowerCase().trim());
  const jobSkillsLower = jobSkills.map((s) => s.toLowerCase().trim());

  const matched = jobSkillsLower.filter((skill) =>
    cvSkillsLower.some(
      (cvSkill) =>
        cvSkill === skill ||
        cvSkill.includes(skill) ||
        skill.includes(cvSkill),
    ),
  );

  return Math.round((matched.length / jobSkillsLower.length) * 100);
}

/**
 * Trả về danh sách kỹ năng trùng khớp
 */
export function getMatchedSkills(cvSkills: string[], jobSkills: string[]): string[] {
  if (!jobSkills || !cvSkills) return [];
  const cvSkillsLower = cvSkills.map((s) => s.toLowerCase().trim());
  return jobSkills.filter((skill) =>
    cvSkillsLower.some(
      (cvSkill) =>
        cvSkill === skill.toLowerCase() ||
        cvSkill.includes(skill.toLowerCase()),
    ),
  );
}

/**
 * Thêm match score vào danh sách job và sort theo score giảm dần
 */
export function enrichJobsWithMatchScore(jobs: Job[], cv: CvProfile | null): Job[] {
  if (!cv) return jobs;
  return jobs
    .map((job) => ({
      ...job,
      matchScore: calcMatchScore(cv.skills, job.skills),
      matchedSkills: getMatchedSkills(cv.skills, job.skills),
    }))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}

/**
 * Xếp hạng ứng viên theo match score cho nhà tuyển dụng
 */
export function rankCandidates<T extends { matchScore?: number }>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}

/**
 * Nhãn hiển thị match score
 */
export function getMatchLabel(score: number): string {
  if (score >= 80) return `⭐ Phù hợp ${score}%`;
  if (score >= 60) return `Phù hợp ${score}%`;
  return `Phù hợp ${score}%`;
}

/**
 * Color tag theo match score
 */
export function getMatchColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'orange';
  return 'default';
}
