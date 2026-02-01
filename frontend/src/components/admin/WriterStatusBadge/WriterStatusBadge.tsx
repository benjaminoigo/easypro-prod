import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import './WriterStatusBadge.css';

export type WriterStatus = 'active' | 'inactive' | 'probation' | 'suspended' | 'pending';

export interface WriterStatusBadgeProps {
  status: WriterStatus;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const statusConfig: Record<WriterStatus, { 
  label: string; 
  icon: React.ElementType;
  className: string;
}> = {
  active: {
    label: 'Active',
    icon: CheckCircle,
    className: 'status-active',
  },
  inactive: {
    label: 'Inactive',
    icon: XCircle,
    className: 'status-inactive',
  },
  probation: {
    label: 'On Probation',
    icon: AlertTriangle,
    className: 'status-probation',
  },
  suspended: {
    label: 'Suspended',
    icon: XCircle,
    className: 'status-suspended',
  },
  pending: {
    label: 'Pending Approval',
    icon: Clock,
    className: 'status-pending',
  },
};

const WriterStatusBadge: React.FC<WriterStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'medium',
  className = '',
}) => {
  const config = statusConfig[status] || statusConfig.inactive;
  const IconComponent = config.icon;

  return (
    <span 
      className={`writer-status-badge ${config.className} badge-${size} ${className}`}
    >
      {showIcon && <IconComponent className="status-icon" />}
      <span className="status-label">{config.label}</span>
    </span>
  );
};

export default WriterStatusBadge;
