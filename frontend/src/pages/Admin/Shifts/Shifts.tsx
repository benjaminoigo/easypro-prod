import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Users,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Target,
  TrendingUp,
  RefreshCw,
  Save,
} from 'lucide-react';
import { Shift } from '../../../types';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import './Shifts.css';

interface WriterProgress {
  writerId: string;
  writerName: string;
  writerEmail: string;
  targetPages: number;
  submittedPages: number;
  approvedPages: number;
  pendingPages: number;
  rejectedPages: number;
  remainingPages: number;
  percentComplete: number;
  isOnTarget: boolean;
  submissionCount: number;
}

interface AllWritersProgress {
  currentShift: {
    id: string;
    startTime: string;
    endTime: string;
    targetPages: number;
  };
  writers: WriterProgress[];
  summary: {
    totalWriters: number;
    writersAtTarget: number;
    writersOnTrack: number;
    writersBehind: number;
    totalApprovedPages: number;
    totalPendingPages: number;
  };
}

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [writersProgress, setWritersProgress] = useState<AllWritersProgress | null>(null);
  const [maxPages, setMaxPages] = useState<number>(20);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShifts();
    fetchCurrentShift();
    fetchWritersProgress();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await api.get('/shifts/history');
      setShifts(response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentShift = async () => {
    try {
      const response = await api.get('/shifts/current');
      setCurrentShift(response.data);
      setMaxPages(response.data.maxPagesPerShift || 20);
    } catch (error) {
      console.error('Error fetching current shift:', error);
    }
  };

  const fetchWritersProgress = async () => {
    try {
      const response = await api.get('/shifts/all-writers-progress');
      setWritersProgress(response.data);
    } catch (error) {
      console.error('Error fetching writers progress:', error);
    }
  };

  const handleUpdateMaxPages = async () => {
    setSaving(true);
    try {
      await api.put('/shifts/max-pages', { maxPages });
      toast.success(`Target pages updated to ${maxPages}`);
      fetchCurrentShift();
      fetchWritersProgress();
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating max pages:', error);
      toast.error('Failed to update target pages');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchWritersProgress();
    toast.info('Progress refreshed');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getShiftProgress = () => {
    if (!currentShift) return 0;
    const start = new Date(currentShift.startTime).getTime();
    const end = new Date(currentShift.endTime).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  const getTimeRemaining = () => {
    if (!currentShift) return '0h 0m';
    const end = new Date(currentShift.endTime).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="shifts-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleRefresh}>
            <RefreshCw />
            Refresh
          </button>
          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
            <Settings />
            Shift Settings
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-modal-content">
            <h3>Shift Settings</h3>
            <div className="settings-form">
              <label>
                <span>Target Pages Per Shift</span>
                <input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 20)}
                  min={1}
                  max={100}
                />
              </label>
              <p className="settings-help">
                Writers need to complete this many approved pages per shift.
              </p>
              <div className="settings-actions">
                <button className="cancel-btn" onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleUpdateMaxPages}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Shift Card */}
      {currentShift && (
        <div className="current-shift-card">
          <div className="shift-card-header">
            <div className="shift-status">
              <div className="status-indicator active"></div>
              <span>Current Shift Active</span>
            </div>
            <div className="shift-time-remaining">
              <Clock />
              <span>{getTimeRemaining()} remaining</span>
            </div>
          </div>
          <div className="shift-card-body">
            <div className="shift-info-grid">
              <div className="shift-info-item">
                <Calendar />
                <div>
                  <span className="label">Date</span>
                  <span className="value">{formatDate(currentShift.startTime)}</span>
                </div>
              </div>
              <div className="shift-info-item">
                <Clock />
                <div>
                  <span className="label">Time</span>
                  <span className="value">
                    {formatTime(currentShift.startTime)} - {formatTime(currentShift.endTime)}
                  </span>
                </div>
              </div>
              <div className="shift-info-item">
                <Users />
                <div>
                  <span className="label">Writers Online</span>
                  <span className="value">{currentShift.activeWriters || 0}</span>
                </div>
              </div>
            </div>
            <div className="shift-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getShiftProgress()}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(getShiftProgress())}% complete</span>
            </div>
          </div>
        </div>
      )}

      {/* Writers Progress Section */}
      {writersProgress && (
        <div className="writers-progress-section">
          <div className="section-header">
            <h3>
              <Target size={20} />
              Writers Shift Progress
            </h3>
            <div className="progress-summary">
              <div className="summary-item success">
                <CheckCircle size={16} />
                <span>{writersProgress.summary.writersAtTarget} at target</span>
              </div>
              <div className="summary-item warning">
                <TrendingUp size={16} />
                <span>{writersProgress.summary.writersOnTrack} on track</span>
              </div>
              <div className="summary-item danger">
                <AlertCircle size={16} />
                <span>{writersProgress.summary.writersBehind} behind</span>
              </div>
            </div>
          </div>

          <div className="writers-progress-grid">
            {writersProgress.writers.map((writer) => (
              <div 
                key={writer.writerId} 
                className={`writer-progress-card ${
                  writer.isOnTarget ? 'on-target' : 
                  writer.percentComplete >= 50 ? 'on-track' : 'behind'
                }`}
              >
                <div className="writer-info">
                  <h4>{writer.writerName}</h4>
                  <span className="writer-email">{writer.writerEmail}</span>
                </div>
                <div className="writer-progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(100, writer.percentComplete)}%` }}
                  ></div>
                </div>
                <div className="writer-stats">
                  <div className="stat">
                    <span className="stat-value">{writer.approvedPages}</span>
                    <span className="stat-label">Approved</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{writer.pendingPages}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{writer.remainingPages}</span>
                    <span className="stat-label">Remaining</span>
                  </div>
                </div>
                <div className="writer-percent">
                  {writer.percentComplete}%
                </div>
              </div>
            ))}
          </div>

          {writersProgress.writers.length === 0 && (
            <div className="no-writers">
              <Users size={48} />
              <p>No writers have submitted work this shift yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Shifts Table */}
      <div className="shifts-table-card">
        <div className="table-header">
          <h3>Recent Shifts</h3>
        </div>
        <table className="shifts-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Writers</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No shifts found
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>
                    <div className="date-cell">
                      <Calendar />
                      <span>{formatDate(shift.startTime)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="time-cell">
                      <Clock />
                      <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${shift.status}`}>
                      {shift.status === 'active' && <Play />}
                      {shift.status === 'completed' && <CheckCircle />}
                      {shift.status === 'scheduled' && <Clock />}
                      {shift.status}
                    </span>
                  </td>
                  <td>
                    <div className="writers-cell">
                      <Users />
                      <span>{shift.activeWriters || 0}</span>
                    </div>
                  </td>
                  <td>
                    <span className="orders-count">{shift.ordersCompleted || 0}</span>
                  </td>
                  <td>
                    <span className="revenue">${(shift.totalRevenue || 0).toLocaleString()}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Shifts;
