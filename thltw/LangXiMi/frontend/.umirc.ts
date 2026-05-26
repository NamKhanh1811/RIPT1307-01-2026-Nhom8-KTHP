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
    // Auth routes (no layout)
    {
      path: '/login',
      component: './auth/login',
      layout: false,
    },
    {
      path: '/register',
      component: './auth/register',
      layout: false,
    },
    // Student routes
    {
      path: '/',
      redirect: '/student/dashboard',
    },
    {
      path: '/student',
      redirect: '/student/dashboard',
    },
    {
      path: '/student/dashboard',
      component: './student/dashboard/index',
      name: 'Dashboard',
      icon: 'DashboardOutlined',
    },
    {
      path: '/student/jobs',
      component: './student/jobs/index',
      name: 'Tìm việc',
      icon: 'SearchOutlined',
    },
    {
      path: '/student/cv',
      component: './student/cv/index',
      name: 'CV của tôi',
      icon: 'FileTextOutlined',
    },
    {
      path: '/student/applications',
      component: './student/applications/index',
      name: 'Ứng tuyển',
      icon: 'UnorderedListOutlined',
    },
    // Employer routes
    {
      path: '/employer/dashboard',
      component: './employer/dashboard',
      name: 'Dashboard',
      icon: 'DashboardOutlined',
    },
    {
      path: '/employer/jobs',
      component: './employer/jobs',
      name: 'Quản lý tin',
      icon: 'BankOutlined',
    },
    {
      path: '/employer/candidates',
      component: './employer/candidates/index',
      name: 'Ứng viên',
      icon: 'TeamOutlined',
    },
    // Admin routes
    {
      path: '/admin/dashboard',
      component: './admin/dashboard/index',
      name: 'Tổng quan',
      icon: 'DashboardOutlined',
    },
    {
      path: '/admin/users',
      component: './admin/users',
      name: 'Quản lý user',
      icon: 'UserOutlined',
    },
    {
      path: '/admin/jobs',
      component: './admin/jobs',
      name: 'Duyệt tin tuyển dụng',
      icon: 'AuditOutlined',
    },
    // 404
    {
      path: '*',
      component: './404',
    },
  ],
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
});
