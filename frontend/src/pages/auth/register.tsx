import { Form, Input, Button, Card, Typography, Divider, Select, message } from 'antd';
import { history, useModel } from '@umijs/max';
import { useState } from 'react';
import { authService } from '@/services/auth';
import { storage } from '@/utils/helpers';
import type { RegisterPayload } from '@/types';
import styles from './login.module.css';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { setInitialState } = useModel('@@initialState');

  const onFinish = async (values: RegisterPayload & { confirmPassword: string }) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = values;
      const res = await authService.register(payload);
      if (res.success) {
        storage.setToken(res.data.token);
        storage.setUser(res.data.user);
        await setInitialState((s: any) => ({
          ...s,
          currentUser: res.data.user,
          token: res.data.token,
        }));
        message.success('Đăng ký thành công!');
        const role = res.data.user.role;
        if (role === 'STUDENT') history.push('/student/dashboard');
        else if (role === 'EMPLOYER') history.push('/employer/dashboard');
        else history.push('/admin/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} style={{ width: 480 }}>
        <div className={styles.logo}>
          <span className={styles.logoDot} />
          <Title level={3} style={{ margin: 0 }}>InternHub</Title>
        </div>
        <Text type="secondary">Tạo tài khoản mới</Text>
        <Divider />

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="example@email.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò của bạn">
              <Select.Option value="STUDENT">Sinh viên tìm việc</Select.Option>
              <Select.Option value="EMPLOYER">Doanh nghiệp tuyển dụng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <Text>
          Đã có tài khoản?{' '}
          <a onClick={() => history.push('/login')}>Đăng nhập</a>
        </Text>
      </Card>
    </div>
  );
}
