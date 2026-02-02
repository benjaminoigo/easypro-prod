import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import './ShiftProgressCard.css';

interface ShiftProgressData {
  targetPages: number;
  submittedPages: number;
  approvedPages: number;
  pendingPages: number;
  rejectedPages: number;
  remainingPages: number;
  percentComplete: number;
  isOnTarget: boolean;
  shiftStartTime: string;
  shiftEndTime: string;
  submissionCount: number;
}

interface ShiftProgressCardProps {
  onRefresh?: () => void;
}

const ShiftProgressCard: React.FC<ShiftProgressCardProps> = ({ onRefresh }) => {
  const [progress, setProgress] = useState<ShiftProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
    // Refresh every 2 minutes
    const interval = setInterval(fetchProgress, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get('/shifts/my-progress');
      setProgress(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching shift progress:', err);
      setError(err.response?.data?.message || 'Failed to load shift progress');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTimeRemaining = () => {
    if (!progress) return '';
    const end = new Date(progress.shiftEndTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return 'Shift ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const getProgressColor = () => {
    if (!progress) return 'gray';
    if (progress.percentComplete >= 100) return 'green';
    if (progress.percentComplete >= 50) return 'blue';
    if (progress.percentComplete >= 25) return 'yellow';
    return 'red';
  };

  if (loading) {
    return (
      <div className="shift-progress-card loading">
        <div className="shift-progress-spinner"></div>
        <p>Loading shift progress...</p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="shift-progress-card error">
        <AlertTriangle size={24} />
        <p>{error || 'Unable to load shift progress'}</p>
      </div>
    );
  }

  return (
    <div className="shift-progress-card">
      <div className="shift-progress-header">
        <div className="shift-progress-title">
          <Target size={20} />
          <h3>Shift Progress</h3>
        </div>
        <div className="shift-time-info">
          <Clock size={14} />
          <span>{getTimeRemaining()}</span>
        </div>
      </div>

      <div className="shift-progress-main">
        <div className="progress-circle-container">
          <div className={`progress-circle ${getProgressColor()}`}>
            <svg viewBox="0 0 100 100">
              <circle
                className="progress-bg"
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className="progress-fill"
                cx="50"
                cy="50"
                r="45"
                strokeDasharray={`${progress.percentComplete * 2.83} 283`}
              />
            </svg>
            <div className="progress-text">
              <span className="progress-percent">{progress.percentComplete}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
        </div>

        <div className="progress-stats">
          <div className="progress-stat">
            <div className="stat-icon target">
              <Target size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Target</span>
              <span className="stat-value">{progress.targetPages} pages</span>
            </div>
          </div>

          <div className="progress-stat">
            <div className="stat-icon approved">
              <CheckCircle size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{progress.approvedPages} pages</span>
            </div>
          </div>

          <div className="progress-stat">
            <div className="stat-icon pending">
              <Clock size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{progress.pendingPages} pages</span>
            </div>
          </div>

          <div className="progress-stat">
            <div className="stat-icon remaining">
              <TrendingUp size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Remaining</span>
              <span className="stat-value">{progress.remainingPages} pages</span>
            </div>
          </div>
        </div>
      </div>

      <div className="shift-progress-footer">
        <div className="shift-period">
          <span>Shift: {formatDate(progress.shiftStartTime)} {formatTime(progress.shiftStartTime)} - {formatDate(progress.shiftEndTime)} {formatTime(progress.shiftEndTime)}</span>
        </div>
        <div className="submission-count">
          <span>{progress.submissionCount} submission{progress.submissionCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {progress.isOnTarget && (
        <div className="target-reached-banner">
          <CheckCircle size={16} />
          <span>🎉 Target reached! Great work!</span>
        </div>
      )}

      {!progress.isOnTarget && progress.percentComplete < 50 && (
        <div className="target-warning-banner">
          <AlertTriangle size={16} />
          <span>Keep going! {progress.remainingPages} pages to reach your target</span>
        </div>
      )}
    </div>
  );
};

export default ShiftProgressCard;
