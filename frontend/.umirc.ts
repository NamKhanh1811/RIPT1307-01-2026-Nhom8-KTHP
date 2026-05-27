import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'InternHub',
  },
  routes: [
    { path: '/login',    component: './auth/login',    layout: false },
    { path: '/register', component: './auth/register', layout: false },

    { path: '/',        redirect: '/student/dashboard' },
    { path: '/student', redirect: '/student/dashboard' },

    // ── Student ──
    {
      path: '/student/dashboard',
      component: './student/dashboard/index',
      name: 'Dashboard',
      icon: 'DashboardOutlined',
      access: 'isStudent',
    },
    {
      path: '/student/jobs',
      component: './student/jobs/index',
      name: 'Tìm việc',
      icon: 'SearchOutlined',
      access: 'isStudent',
    },
    {
      path: '/student/cv',
      component: './student/cv/index',
      name: 'CV của tôi',
      icon: 'FileTextOutlined',
      access: 'isStudent',
    },
    {
      path: '/student/applications',
      component: './student/applications/index',
      name: 'Ứng tuyển',
      icon: 'UnorderedListOutlined',
      access: 'isStudent',
    },

    // ── Employer ──
    {
      path: '/employer/dashboard',
      component: './employer/dashboard',
      name: 'Dashboard',
      icon: 'DashboardOutlined',
      access: 'isEmployer',
    },
    {
      path: '/employer/jobs',
      component: './employer/jobs',
      name: 'Quản lý tin',
      icon: 'BankOutlined',
      access: 'isEmployer',
    },
    {
      path: '/employer/candidates',
      component: './employer/candidates/index',
      name: 'Ứng viên',
      icon: 'TeamOutlined',
      access: 'isEmployer',
    },

    // ── Admin ──
    {
      path: '/admin/dashboard',
      component: './admin/dashboard/index',
      name: 'Tổng quan',
      icon: 'DashboardOutlined',
      access: 'isAdmin',
    },
    {
      path: '/admin/users',
      component: './admin/users',
      name: 'Quản lý user',
      icon: 'UserOutlined',
      access: 'isAdmin',
    },
    {
      path: '/admin/jobs',
      component: './admin/jobs',
      name: 'Duyệt tin tuyển dụng',
      icon: 'AuditOutlined',
      access: 'isAdmin',
    },

    { path: '*', component: './404' },
  ],
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
});