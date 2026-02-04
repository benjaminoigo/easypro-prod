import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../../../components/common/ConfirmModal';
import './PendingApprovals.css';

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  isApproved: boolean;
  isActive: boolean;
}

const PendingApprovals: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/users/pending-approvals');
      // Filter out placeholder/invite users and non-writer/past approvals
      const realUsers = response.data.filter(
        (user: PendingUser) =>
          !user.email.includes('@placeholder.temp') &&
          user.role === 'writer' &&
          user.isApproved === false
      );
      setPendingUsers(realUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await api.put(`/auth/approve/${userId}`);
      toast.success('User approved successfully!');
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (user: PendingUser) => {
    setRejectTarget(user);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    setProcessingId(rejectTarget.id);
    try {
      await api.delete(`/auth/reject/${rejectTarget.id}`);
      toast.success('User rejected and removed');
      setPendingUsers(pendingUsers.filter(user => user.id !== rejectTarget.id));
      setRejectTarget(null);
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    } finally {
      setRejecting(false);
      setProcessingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="pending-approvals-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <p className="page-subtitle">Review and approve new writer registrations</p>
        </div>
        <button className="refresh-btn" onClick={fetchPendingUsers}>
          <RefreshCw />
          Refresh
        </button>
      </div>

      {/* Stats Card */}
      <div className="stats-card">
        <div className="stat-icon">
          <Clock />
        </div>
        <div className="stat-content">
          <span className="stat-value">{pendingUsers.length}</span>
          <span className="stat-label">Pending Approvals</span>
        </div>
      </div>

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <div className="empty-state">
          <CheckCircle className="empty-icon" />
          <h3>All Caught Up!</h3>
          <p>No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="approvals-list">
          {pendingUsers.map((user) => (
            <div key={user.id} className="approval-card">
              <div className="user-info">
                <div className="user-avatar">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div className="user-details">
                  <h3 className="user-name">{user.firstName} {user.lastName}</h3>
                  <div className="user-meta">
                    <span className="meta-item">
                      <Mail />
                      {user.email}
                    </span>
                    <span className="meta-item">
                      <Calendar />
                      Registered: {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="status-badges">
                <span className="badge pending">
                  <AlertCircle />
                  Pending Approval
                </span>
                <span className="badge role">
                  {user.role}
                </span>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(user.id)}
                  disabled={processingId === user.id}
                >
                  {processingId === user.id ? (
                    <RefreshCw className="spinning" />
                  ) : (
                    <UserCheck />
                  )}
                  Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(user)}
                  disabled={processingId === user.id}
                >
                  <UserX />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!rejectTarget}
        title="Reject user?"
        message="This will delete the user registration and cannot be undone."
        confirmText="Reject"
        cancelText="Cancel"
        isDanger
        isLoading={rejecting}
        onConfirm={confirmReject}
        onCancel={() => !rejecting && setRejectTarget(null)}
      />
    </div>
  );
};

export default PendingApprovals;
