import { Form, Input, Button, Card, Typography, Divider, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { useState } from 'react';
import { authService } from '@/services/auth';
import { storage } from '@/utils/helpers';
import type { LoginPayload } from '@/types';
import styles from './login.module.less';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { setInitialState } = useModel('@@initialState');

  const onFinish = async (values: LoginPayload) => {  
    setLoading(true);
    try {
      const res = await authService.login(values);
      if (res.success) {
        storage.setToken(res.data.token);
        storage.setUser(res.data.user);
        // setInitialState là bất đồng bộ — phải đợi nó xong rồi mới redirect
        // để UmiJS access control đọc được state mới, tránh 403
        await setInitialState((s: any) => ({
          ...s,
          currentUser: res.data.user,
          token: res.data.token,
        }));
        message.success('Đăng nhập thành công!');
        const role = res.data.user.role;
        const dest = role === 'STUDENT'  ? '/student/dashboard'
                   : role === 'EMPLOYER' ? '/employer/dashboard'
                   : '/admin/dashboard';
        // Dùng setTimeout để đảm bảo React re-render với state mới trước khi navigate
        setTimeout(() => history.push(dest), 50);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoDot} />
          <Title level={3} style={{ margin: 0 }}>LangXiMi</Title>
        </div>
        <Text type="secondary">Kết nối sinh viên với cơ hội việc làm</Text>

        <Divider />

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="example@email.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Text>
          Chưa có tài khoản?{' '}
          <a onClick={() => history.push('/register')}>Đăng ký ngay</a>
        </Text>
      </Card>
    </div>
  );
}