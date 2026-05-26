import type { GlobalState } from './app';

/**
 * UmiJS access control
 * Dùng để guard routes theo role
 */
export default function access(initialState: GlobalState) {
  const { currentUser } = initialState ?? {};

  return {
    isLoggedIn:  !!currentUser,
    isStudent:   currentUser?.role === 'STUDENT',
    isEmployer:  currentUser?.role === 'EMPLOYER',
    isAdmin:     currentUser?.role === 'ADMIN',
  };
}
