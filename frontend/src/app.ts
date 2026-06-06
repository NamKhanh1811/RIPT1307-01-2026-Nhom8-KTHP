import { history } from '@umijs/max';
import viVN from 'antd/locale/vi_VN';
import { authService } from '@/services/auth';
import { storage } from '@/utils/helpers';
import { rightContentRender } from '@/components/layout/RightContent';
import { initSocket, disconnectSocket } from '@/hooks/useSocket';
import type { User } from '@/types';

export interface GlobalState {
  currentUser: User | null;
  token: string | null;
}

const PUBLIC_PATHS = ['/login', '/register'];

const ROLE_HOME: Record<string, string> = {
  STUDENT:  '/student/dashboard',
  EMPLOYER: '/employer/dashboard',
  ADMIN:    '/admin/dashboard',
};

export async function getInitialState(): Promise<GlobalState> {
  const token      = storage.getToken();
  const cachedUser = storage.getUser();

  if (!token) {
    return { currentUser: null, token: null };
  }

  // Khởi tạo socket ngay khi có token — trước khi render bất kỳ page nào
  initSocket();

  if (cachedUser) {
    authService.getMe()
      .then((res) => { if (res.success) storage.setUser(res.data); })
      .catch(() => { storage.clear(); disconnectSocket(); });
    return { currentUser: cachedUser, token };
  }

  try {
    const res = await authService.getMe();
    if (res.success) {
      storage.setUser(res.data);
      return { currentUser: res.data, token };
    }
  } catch {
    storage.clear();
    disconnectSocket();
  }

  return { currentUser: null, token: null };
}

export const antd = () => ({
  locale: viVN,
});

export const layout = () => {
  return {
    rightContentRender,
  };
};

export function onRouteChange({ location }: { location: { pathname: string }; isFirst: boolean }) {
  const { pathname } = location;
  const currentUser  = storage.getUser() as User | null;

  if (currentUser && PUBLIC_PATHS.includes(pathname)) {
    history.replace(ROLE_HOME[currentUser.role] ?? '/login');
    return;
  }

  if (!currentUser && !PUBLIC_PATHS.includes(pathname)) {
    history.replace('/login');
    return;
  }

  if (currentUser && pathname === '/') {
    history.replace(ROLE_HOME[currentUser.role] ?? '/login');
  }
}