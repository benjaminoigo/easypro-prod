import React from 'react';
import { FileText, TrendingUp, Target, Award } from 'lucide-react';
import './ShiftProgress.css';

export interface ShiftProgressProps {
  currentPages: number;
  maxPages: number;
  currentOrders: number;
  shiftStartTime: string;
  shiftEndTime: string;
  isShiftActive: boolean;
  earnings?: number;
  className?: string;
}

const ShiftProgress: React.FC<ShiftProgressProps> = ({
  currentPages,
  maxPages,
  currentOrders,
  shiftStartTime,
  shiftEndTime,
  isShiftActive,
  earnings = 0,
  className = '',
}) => {
  const progressPercent = Math.min((currentPages / maxPages) * 100, 100);
  const isNearLimit = progressPercent >= 80;
  const isAtLimit = currentPages >= maxPages;

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeRemaining = (): string => {
    const now = new Date();
    const end = new Date(shiftEndTime);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Shift ended';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className={`shift-progress ${className}`}>
      <div className="progress-header">
        <div className="header-left">
          <span className={`shift-status ${isShiftActive ? 'active' : 'inactive'}`}>
            <span className="status-dot" />
            {isShiftActive ? 'Shift Active' : 'No Active Shift'}
          </span>
          {isShiftActive && (
            <span className="shift-time">
              {formatTime(shiftStartTime)} - {formatTime(shiftEndTime)}
            </span>
          )}
        </div>
        {isShiftActive && (
          <span className="time-remaining">{getTimeRemaining()}</span>
        )}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${isNearLimit ? 'near-limit' : ''} ${isAtLimit ? 'at-limit' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="progress-labels">
          <span className="pages-completed">
            {currentPages} / {maxPages} pages
          </span>
          <span className="progress-percent">{progressPercent.toFixed(0)}%</span>
        </div>
      </div>

      <div className="progress-stats">
        <div className="stat-item">
          <div className="stat-icon pages">
            <FileText />
          </div>
          <div className="stat-content">
            <span className="stat-value">{currentPages}</span>
            <span className="stat-label">Pages</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon orders">
            <Target />
          </div>
          <div className="stat-content">
            <span className="stat-value">{currentOrders}</span>
            <span className="stat-label">Orders</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon earnings">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <span className="stat-value">${earnings.toFixed(2)}</span>
            <span className="stat-label">Earned</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon remaining">
            <Award />
          </div>
          <div className="stat-content">
            <span className="stat-value">{Math.max(maxPages - currentPages, 0)}</span>
            <span className="stat-label">Remaining</span>
          </div>
        </div>
      </div>

      {isAtLimit && (
        <div className="limit-warning">
          <Award className="warning-icon" />
          <span>You've reached your page limit for this shift. Great work!</span>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="near-limit-notice">
          <TrendingUp className="notice-icon" />
          <span>You're close to reaching your shift limit!</span>
        </div>
      )}
    </div>
  );
};

export default ShiftProgress;
