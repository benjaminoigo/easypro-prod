// Minimal writer profile for User type to avoid circular dependency
export interface WriterProfile {
  id: string;
  userId: string;
  status: 'active' | 'probation' | 'suspended';
  isActive: boolean;
  isOnline: boolean;
  balanceUSD: number;
  totalEarnings: number;
  currentBalance: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'writer';
  isActive: boolean;
  isApproved: boolean;
  writerProfile?: WriterProfile;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ user: User; access_token: string }>;
  logout: () => void;
  isLoading: boolean;
}
