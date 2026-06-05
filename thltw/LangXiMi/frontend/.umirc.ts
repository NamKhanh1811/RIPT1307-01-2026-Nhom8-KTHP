import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: { configProvider: { locale: 'vi_VN' } },
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

    // Root redirect — xử lý trong onPageChange của app.ts theo role
    {
      path: '/',
      redirect: '/login',
    },

    // Student routes — chỉ STUDENT được vào
    {
      path: '/student',
      redirect: '/student/dashboard',
    },
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
      path: '/student/jobs/:id',
      component: './student/jobs/detail',
      name: 'Chi tiết việc làm',
      hideInMenu: true,
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

    // Employer routes — chỉ EMPLOYER được vào
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

    // Admin routes — chỉ ADMIN được vào
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