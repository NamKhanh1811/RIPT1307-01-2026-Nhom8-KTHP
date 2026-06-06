import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: { configProvider: { locale: 'vi_VN' } },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'LangXiMi',
  },
  routes: [
    // Auth routes (no layout)
    { path: '/login',    component: './auth/login',    layout: false },
    { path: '/register', component: './auth/register', layout: false },

    // Root redirect
    { path: '/', redirect: '/login' },

    // Student routes
    { path: '/student', redirect: '/student/dashboard' },
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
    {
      path: '/student/network',
      component: './network/index',
      name: 'Mạng lưới',
      icon: 'TeamOutlined',
      access: 'isStudent',
    },
    {
      path: '/student/messages',
      component: './messages/index',
      name: 'Tin nhắn',
      icon: 'MessageOutlined',
      access: 'isStudent',
    },
    {
      path: '/student/posts',
      component: './student/posts/index',
      name: 'Bảng tin',
      icon: 'CommentOutlined',
      access: 'isStudent',
    },

    // Employer routes
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
    {
      path: '/employer/network',
      component: './network/index',
      name: 'Mạng lưới',
      icon: 'TeamOutlined',
      access: 'isEmployer',
    },
    {
      path: '/employer/messages',
      component: './messages/index',
      name: 'Tin nhắn',
      icon: 'MessageOutlined',
      access: 'isEmployer',
    },

    // Admin routes
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
    { path: '*', component: './404' },
  ],
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
});