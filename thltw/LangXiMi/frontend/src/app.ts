import { history } from '@umijs/max';
import { theme } from 'antd';
import { authService } from '@/services/auth';
import { storage } from '@/utils/helpers';
import { rightContentRender } from '@/components/layout/RightContent';
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

  if (!token) return { currentUser: null, token: null };

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

export const antd = () => ({
  theme: {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary:        '#6366f1',
      colorBgBase:         '#0f172a',
      colorBgContainer:    '#1e293b',
      colorBgElevated:     '#1e293b',
      colorBgLayout:       '#0f172a',
      colorBorder:         '#334155',
      colorBorderSecondary:'#1e293b',
      colorText:           '#f1f5f9',
      colorTextSecondary:  '#94a3b8',
      colorTextTertiary:   '#64748b',
      borderRadius:        10,
      fontFamily:          "'DM Sans', 'Segoe UI', sans-serif",
    },
    components: {
      Layout: {
        siderBg:        '#0f172a',
        headerBg:       '#0f172a',
        bodyBg:         '#0b1120',
        triggerBg:      '#1e293b',
        triggerColor:   '#94a3b8',
      },
      Menu: {
        darkItemBg:           '#0f172a',
        darkSubMenuItemBg:    '#0b1120',
        darkItemSelectedBg:   '#312e81',
        darkItemSelectedColor:'#a5b4fc',
        darkItemColor:        '#94a3b8',
        darkItemHoverColor:   '#f1f5f9',
        darkItemHoverBg:      '#1e293b',
      },
      Card: {
        colorBgContainer: '#1e293b',
        colorBorderSecondary: '#334155',
      },
      Table: {
        colorBgContainer:     '#1e293b',
        headerBg:             '#162032',
        rowHoverBg:           '#253347',
        borderColor:          '#334155',
      },
      Modal: {
        contentBg: '#1e293b',
        headerBg:  '#1e293b',
      },
      Drawer: {
        colorBgElevated: '#1e293b',
      },
      Input: {
        colorBgContainer:    '#0f172a',
        colorBorder:         '#334155',
        activeBorderColor:   '#6366f1',
        hoverBorderColor:    '#818cf8',
      },
      Select: {
        colorBgContainer:    '#0f172a',
        colorBgElevated:     '#1e293b',
        optionSelectedBg:    '#312e81',
      },
      DatePicker: {
        colorBgContainer: '#0f172a',
        colorBgElevated:  '#1e293b',
      },
      Button: {
        primaryColor:     '#fff',
        colorPrimaryHover:'#818cf8',
      },
      Tag: {
        colorBgBase: '#0f172a',
      },
    },
  },
});

export const layout = () => ({
  rightContentRender,
});

export function onRouteChange({ location }: { location: { pathname: string }; isFirst: boolean }) {
  const { pathname }  = location;
  const currentUser   = storage.getUser() as User | null;

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
