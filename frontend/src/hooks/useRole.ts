import { useAuth } from './useAuth';

type Role = 'admin' | 'writer';

export const useRole = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isWriter = user?.role === 'writer';

  const hasRole = (role: Role): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return roles.some(role => user?.role === role);
  };

  return {
    role: user?.role,
    isAdmin,
    isWriter,
    hasRole,
    hasAnyRole,
  };
};
