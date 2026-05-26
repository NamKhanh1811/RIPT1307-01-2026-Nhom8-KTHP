/**
 * Job Matching Engine (Backend)
 * Tính match score giữa CV sinh viên và yêu cầu job
 */

function calcMatchScore(cvSkills = [], jobSkills = []) {
  if (!jobSkills.length || !cvSkills.length) return 0;
  const cvLower = cvSkills.map((s) => s.toLowerCase().trim());
  const jobLower = jobSkills.map((s) => s.toLowerCase().trim());
  const matched = jobLower.filter((skill) =>
    cvLower.some((cv) => cv === skill || cv.includes(skill) || skill.includes(cv)),
  );
  return Math.round((matched.length / jobLower.length) * 100);
}

function getMatchedSkills(cvSkills = [], jobSkills = []) {
  const cvLower = cvSkills.map((s) => s.toLowerCase().trim());
  return jobSkills.filter((skill) =>
    cvLower.some((cv) => cv === skill.toLowerCase() || cv.includes(skill.toLowerCase())),
  );
}

module.exports = { calcMatchScore, getMatchedSkills };
