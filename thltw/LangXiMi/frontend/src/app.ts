import { authService } from '@/services/auth';
import { storage } from '@/utils/helpers';
import type { User } from '@/types';

export interface GlobalState {
  currentUser: User | null;
  token: string | null;
}

/**
 * UmiJS initialState — chạy khi app khởi động
 * Dùng để lấy thông tin user đang đăng nhập
 */
export async function getInitialState(): Promise<GlobalState> {
  const token = storage.getToken();
  const cachedUser = storage.getUser();

  if (!token) {
    return { currentUser: null, token: null };
  }

  // Nếu đã có user cache thì dùng luôn, bg fetch để refresh
  if (cachedUser) {
    // Refresh user info in background
    authService.getMe().then((res) => {
      if (res.success) storage.setUser(res.data);
    }).catch(() => {
      storage.clear();
    });
    return { currentUser: cachedUser, token };
  }

  // Gọi API lấy user
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
