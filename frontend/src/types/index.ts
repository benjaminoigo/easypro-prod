// Re-export all types from individual files
export * from './user';
export * from './order';
export * from './shift';
export * from './payment';

// Additional shared types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalWriters: number;
  totalOrders: number;
  completedOrders: number;
  totalCompletedAmount: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  totalApprovedPages: number;
  totalPaidAmount: number;
  totalPendingPayments: number;
  totalPayableAmount: number;
}

export interface ChartData {
  date: string;
  total: number;
  completed: number;
}

export interface WriterEarnings {
  name: string;
  earnings: number;
  currentShiftPages: number;
  status: string;
}

export interface Analytics {
  totalWriters: number;
  activeOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  onlineWriters: number;
}