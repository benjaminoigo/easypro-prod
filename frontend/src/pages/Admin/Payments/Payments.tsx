import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  User,
  Calendar,
} from 'lucide-react';
import { Payment } from '../../../types';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import './Payments.css';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await api.patch(`/payments/${paymentId}/approve`);
      toast.success('Payment approved successfully');
      fetchPayments();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      await api.patch(`/payments/${paymentId}/reject`);
      toast.success('Payment rejected');
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'completed';
      case 'pending':
        return 'pending';
      case 'rejected':
      case 'failed':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle />;
      case 'pending':
        return <Clock />;
      case 'rejected':
      case 'failed':
        return <XCircle />;
      default:
        return <Clock />;
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.writer?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.writer?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCompleted = payments
    .filter(p => p.status === 'completed' || p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      {/* Header */}
      <div className="page-header">
        <button className="export-btn">
          <Download />
          Export Report
        </button>
      </div>

      {/* Stats Summary */}
      <div className="payments-stats">
        <div className="stat-item">
          <div className="stat-icon green">
            <DollarSign />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatUSD(totalCompleted)}</span>
            <span className="stat-label">Total Paid</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon yellow">
            <Clock />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatUSD(totalPending)}</span>
            <span className="stat-label">Pending Payments</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon blue">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{payments.filter(p => p.status === 'pending').length}</span>
            <span className="stat-label">Awaiting Approval</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search />
          <input
            type="text"
            placeholder="Search by writer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="payments-table-card">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Writer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="writer-info">
                      <div className="writer-avatar">
                        {payment.writer?.user?.firstName?.[0]}{payment.writer?.user?.lastName?.[0]}
                      </div>
                      <div className="writer-details">
                        <h4>{payment.writer?.user?.firstName} {payment.writer?.user?.lastName}</h4>
                        <p>{payment.writer?.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="amount-cell">
                      <DollarSign />
                      <span>{formatUSD(payment.amount)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar />
                      <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    {payment.status === 'pending' ? (
                      <div className="action-buttons">
                        <button
                          className="action-btn approve"
                          onClick={() => handleApprovePayment(payment.id)}
                        >
                          <CheckCircle />
                          Approve
                        </button>
                        <button
                          className="action-btn reject"
                          onClick={() => handleRejectPayment(payment.id)}
                        >
                          <XCircle />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="processed">Processed</span>
                    )}
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

export default Payments;
