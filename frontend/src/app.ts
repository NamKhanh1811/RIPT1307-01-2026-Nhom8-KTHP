import { history } from '@umijs/max';
import { authService } from '@/services/auth';
import { storage } from '@/utils/helpers';
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

/**
 * UmiJS initialState — chạy khi app khởi động
 */
export async function getInitialState(): Promise<GlobalState> {
  const token      = storage.getToken();
  const cachedUser = storage.getUser();

  if (!token) {
    return { currentUser: null, token: null };
  }

  if (cachedUser) {
    authService.getMe()
      .then((res) => { if (res.success) storage.setUser(res.data); })
      .catch(() => { storage.clear(); });
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
  }

  return { currentUser: null, token: null };
}

/**
 * onRouteChange — key hợp lệ trong @umijs/max
 * Chạy mỗi khi URL thay đổi, dùng để guard auth và redirect đúng role
 */
export function onRouteChange({ location, isFirst }: { location: { pathname: string }; isFirst: boolean }) {
  const { pathname } = location;
  const currentUser  = storage.getUser() as User | null;

  // Đã đăng nhập mà vào /login hoặc /register → về đúng dashboard
  if (currentUser && PUBLIC_PATHS.includes(pathname)) {
    history.replace(ROLE_HOME[currentUser.role] ?? '/login');
    return;
  }

  // Chưa đăng nhập mà vào trang cần auth → về /login
  if (!currentUser && !PUBLIC_PATHS.includes(pathname)) {
    history.replace('/login');
    return;
  }

  // Đã đăng nhập vào root '/' → về đúng dashboard theo role
  if (currentUser && pathname === '/') {
    history.replace(ROLE_HOME[currentUser.role] ?? '/login');
  }
}