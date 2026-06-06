import type { User, UserRole } from '@/types';

const TOKEN_KEY = 'internhub_token';
const USER_KEY = 'internhub_user';

export const storage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

// Chuyển path avatar từ backend (/uploads/avatars/...) thành URL có thể dùng trong <img src>
// /uploads được proxy qua UMI dev server → backend:3001
// Strip timestamp cũ (nếu có) trước khi trả về để tránh double-timestamp
export function getAvatarUrl(avatar?: string | null): string | undefined {
  if (!avatar) return undefined;
  // Bỏ ?t=... cũ nếu có, trả về path sạch
  return avatar.split('?')[0];
}

export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

export function daysUntil(dateInput: string | Date | null | undefined): number {
  if (!dateInput) return 0;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 0;
  const diff = d.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}