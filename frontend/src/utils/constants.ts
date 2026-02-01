// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Shift Configuration
export const SHIFT_DURATION_HOURS = 24;
export const MAX_PAGES_PER_SHIFT = 50;

// Order Status
export const ORDER_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Submission Status
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
} as const;

// Writer Status
export const WRITER_STATUS = {
  ACTIVE: 'active',
  PROBATION: 'probation',
  SUSPENDED: 'suspended',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  WRITER: 'writer',
} as const;

// Cancellation Consequences
export const CANCELLATION_CONSEQUENCES = {
  WARNING: 'warning',
  PROBATION: 'probation',
  SUSPENSION: 'suspension',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal',
  CHECK: 'check',
  OTHER: 'other',
} as const;

// Colors for Charts
export const CHART_COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

// Status Colors
export const STATUS_COLORS = {
  assigned: '#3b82f6',
  in_progress: '#f59e0b',
  submitted: '#8b5cf6',
  completed: '#10b981',
  cancelled: '#ef4444',
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  paid: '#10b981',
  failed: '#ef4444',
  active: '#10b981',
  probation: '#f59e0b',
  suspended: '#ef4444',
};
