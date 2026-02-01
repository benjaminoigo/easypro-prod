import { User } from './user';

export interface Writer {
  id: string;
  userId: string;
  status: 'active' | 'probation' | 'suspended';
  isActive: boolean;
  isOnline: boolean;
  balanceUSD: number;
  lifetimeEarnings: number;
  totalOrders: number;
  totalOrdersCompleted: number;
  completedOrders: number;
  totalPagesCompleted: number;
  currentShiftPages: number;
  currentShiftOrders: number;
  averageRating: number;
  totalEarnings: number;
  pendingPayments: number;
  currentBalance: number;
  user?: User;
  lastSubmissionDate?: string;
}

export interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  maxPagesPerShift: number;
  isActive: boolean;
  status?: 'active' | 'completed' | 'scheduled';
  activeWriters?: number;
  ordersCompleted?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
}
