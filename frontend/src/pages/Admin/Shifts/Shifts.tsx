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
} from 'lucide-react';
import { Shift } from '../../../types';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import './Shifts.css';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);

  useEffect(() => {
    fetchShifts();
    fetchCurrentShift();
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
    } catch (error) {
      console.error('Error fetching current shift:', error);
    }
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
        <button className="settings-btn">
          <Settings />
          Shift Settings
        </button>
      </div>

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
