import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Upload,
  Calendar,
  CheckCircle,
  AlertCircle,
  Star,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Order, Submission, Writer } from '../../../types';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import ShiftProgressCard from '../../../components/common/ShiftProgressCard';
import './Dashboard.css';

interface WriterStats {
  totalOrders: number;
  completedOrders: number;
  averageRating: number;
  totalEarnings: number;
  pendingPayments: number;
  currentBalance: number;
  currentShiftPages: number;
  currentShiftOrders: number;
  maxPagesPerShift: number;
  hasReachedLimit: boolean;
  remainingPages: number;
  shiftActive: boolean;
  shiftStart: string | null;
  shiftEnd: string | null;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<WriterStats>({
    totalOrders: 0,
    completedOrders: 0,
    averageRating: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    currentBalance: 0,
    currentShiftPages: 0,
    currentShiftOrders: 0,
    maxPagesPerShift: 20,
    hasReachedLimit: false,
    remainingPages: 20,
    shiftActive: false,
    shiftStart: null,
    shiftEnd: null,
  });
  
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [writerProfile, setWriterProfile] = useState<Writer | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate weekly earnings from recent submissions
  const getWeeklyEarnings = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = days.map((day, index) => ({
      day,
      earnings: 0,
    }));

    recentSubmissions.forEach((sub: any) => {
      const subDate = new Date(sub.createdAt);
      const daysDiff = Math.floor((today.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        const dayIndex = subDate.getDay();
        weekData[dayIndex].earnings += Number(sub.amount) || 0;
      }
    });

    // Reorder to start from Monday
    return [...weekData.slice(1), weekData[0]];
  };

  // Calculate monthly orders from order history
  const getMonthlyOrders = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentMonth = today.getMonth();
    
    // Get last 6 months
    const monthData: { month: string; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      monthData.push({
        month: months[monthIndex],
        orders: 0,
      });
    }

    assignedOrders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const monthsDiff = (today.getFullYear() - orderDate.getFullYear()) * 12 + (today.getMonth() - orderDate.getMonth());
      if (monthsDiff >= 0 && monthsDiff < 6) {
        const dataIndex = 5 - monthsDiff;
        if (dataIndex >= 0) {
          monthData[dataIndex].orders++;
        }
      }
    });

    return monthData;
  };

  const weeklyEarnings = getWeeklyEarnings();
  const monthlyOrders = getMonthlyOrders();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, submissionsRes, profileRes] = await Promise.all([
        api.get('/orders/my-orders'),
        api.get('/submissions/my-submissions'),
        api.get('/writers/me'),
      ]);

      setAssignedOrders(ordersRes.data);
      setRecentSubmissions(submissionsRes.data);
      setWriterProfile(profileRes.data);

      if (profileRes.data) {
        setStats({
          totalOrders: profileRes.data.totalOrders || 0,
          completedOrders: profileRes.data.completedOrders || 0,
          averageRating: profileRes.data.averageRating || 0,
          totalEarnings: profileRes.data.totalEarnings || 0,
          pendingPayments: profileRes.data.pendingPayments || 0,
          currentBalance: profileRes.data.currentBalance || 0,
          currentShiftPages: profileRes.data.currentShiftPages || 0,
          currentShiftOrders: profileRes.data.currentShiftOrders || 0,
          maxPagesPerShift: profileRes.data.maxPagesPerShift || 20,
          hasReachedLimit: profileRes.data.hasReachedLimit || false,
          remainingPages: profileRes.data.remainingPages || 20,
          shiftActive: profileRes.data.shiftActive || false,
          shiftStart: profileRes.data.shiftStart || null,
          shiftEnd: profileRes.data.shiftEnd || null,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (orderId: string) => {
    try {
      await api.post(`/submissions`, { orderId });
      toast.success('Submission created successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating submission:', error);
      toast.error('Failed to create submission');
    }
  };

  const getOrderPriority = (deadline: string) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const hoursLeft = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 24) return 'high';
    if (hoursLeft < 72) return 'medium';
    return 'low';
  };

  const formatTimeLeft = (deadline: string) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const diff = dueDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="writer-loading">
        <div className="writer-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="writer-dashboard">
      {/* Header */}
      <div className="writer-header">
        <div className="writer-header-left">
          <p>Welcome back, {writerProfile?.user?.firstName}!</p>
        </div>
        <div className="writer-header-right">
          <div className="writer-header-stat">
            <Star className="star-icon" />
            <span>{stats.averageRating.toFixed(1)} rating</span>
          </div>
          <div className="writer-header-stat">
            <Calendar />
            <span>Shift:</span>
            <span className={`writer-shift-badge ${writerProfile?.isOnline ? 'active' : 'offline'}`}>
              {writerProfile?.isOnline ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="writer-stats-grid">
        <div className="writer-stat-card">
          <div className="writer-stat-header">
            <div className="writer-stat-icon blue">
              <FileText />
            </div>
            <div className="writer-stat-info">
              <p className="writer-stat-label">Assigned Orders</p>
              <p className="writer-stat-value">{assignedOrders.length}</p>
            </div>
          </div>
          <div className="writer-stat-footer">
            {stats.completedOrders} completed total
          </div>
        </div>

        <div className="writer-stat-card">
          <div className="writer-stat-header">
            <div className="writer-stat-icon yellow">
              <Clock />
            </div>
            <div className="writer-stat-info">
              <p className="writer-stat-label">Completion Rate</p>
              <p className="writer-stat-value">
                {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="writer-stat-footer">
            <span className="positive">
              <TrendingUp size={14} />
              +5% this month
            </span>
          </div>
        </div>

        <div className="writer-stat-card">
          <div className="writer-stat-header">
            <div className="writer-stat-icon green">
              <DollarSign />
            </div>
            <div className="writer-stat-info">
              <p className="writer-stat-label">Current Balance</p>
              <p className="writer-stat-value">{formatUSD(stats.currentBalance)}</p>
            </div>
          </div>
          <div className="writer-stat-footer">
            {formatUSD(stats.pendingPayments)} pending
          </div>
        </div>

        <div className="writer-stat-card">
          <div className="writer-stat-header">
            <div className="writer-stat-icon purple">
              <Star />
            </div>
            <div className="writer-stat-info">
              <p className="writer-stat-label">Average Rating</p>
              <p className="writer-stat-value">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
          <div className="writer-stat-footer">
            out of 5.0
          </div>
        </div>
      </div>

      {/* Shift Progress Section */}
      <div className="writer-shift-progress-section">
        <ShiftProgressCard />
      </div>

      {/* Charts Section */}
      <div className="writer-charts-grid">
        <div className="writer-chart-card">
          <h3 className="writer-chart-title">Weekly Earnings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`KSh ${value}`, 'Earnings']} />
              <Line type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="writer-chart-card">
          <h3 className="writer-chart-title">Monthly Orders</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders and Submissions Section */}
      <div className="writer-tables-grid">
        {/* Assigned Orders */}
        <div className="writer-table-card">
          <div className="writer-table-header">
            <h3 className="writer-table-title">Assigned Orders</h3>
          </div>
          {assignedOrders.length === 0 ? (
            <div className="writer-empty-state">
              No assigned orders
            </div>
          ) : (
            <ul className="writer-table-list">
              {assignedOrders.map((order) => {
                const priority = getOrderPriority(order.deadline);
                const timeLeft = formatTimeLeft(order.deadline);
                
                return (
                  <li key={order.id} className="writer-table-item">
                    <div className="writer-table-item-content">
                      <div className="writer-table-item-left">
                        <div className="writer-table-item-icon">
                          <FileText />
                        </div>
                        <div className="writer-table-item-info">
                          <h4>{order.subject}</h4>
                          <p>{order.pages} pages • {formatUSD(order.totalAmount || order.pages * order.cpp)}</p>
                          <div className="meta">
                            <Clock />
                            <span>Due: {new Date(order.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="writer-table-item-right">
                        <span className={`writer-priority-badge ${priority}`}>
                          {timeLeft}
                        </span>
                        <button
                          onClick={() => submitOrder(order.id)}
                          className="writer-submit-btn"
                        >
                          <Upload />
                          Submit
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="writer-table-footer">
            <Link to="/writer/orders" className="writer-view-all-link">
              View all orders →
            </Link>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="writer-table-card">
          <div className="writer-table-header">
            <h3 className="writer-table-title">Recent Submissions</h3>
          </div>
          {recentSubmissions.length === 0 ? (
            <div className="writer-empty-state">
              No recent submissions
            </div>
          ) : (
            <ul className="writer-table-list">
              {recentSubmissions.map((submission) => (
                <li key={submission.id} className="writer-table-item">
                  <div className="writer-table-item-content">
                    <div className="writer-table-item-left">
                      <div className={`writer-table-item-icon ${
                        submission.status === 'approved' ? 'success' :
                        submission.status === 'rejected' ? 'error' : 'warning'
                      }`}>
                        {submission.status === 'approved' ? (
                          <CheckCircle />
                        ) : submission.status === 'rejected' ? (
                          <AlertCircle />
                        ) : (
                          <Clock />
                        )}
                      </div>
                      <div className="writer-table-item-info">
                        <h4>{submission.order?.title || 'Untitled Order'}</h4>
                        <p>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`writer-status-badge ${submission.status}`}>
                      {submission.status}
                    </span>
                  </div>
                  {submission.feedback && (
                    <div className="writer-feedback">
                      Feedback: {submission.feedback}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="writer-table-footer">
            <Link to="/writer/submissions" className="writer-view-all-link">
              View all submissions →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="writer-quick-actions">
        <h3>Quick Actions</h3>
        <div className="writer-actions-grid">
          <Link to="/writer/orders" className="writer-action-card">
            <div className="writer-action-icon blue">
              <FileText />
            </div>
            <div className="writer-action-text">
              <h4>View All Orders</h4>
              <p>Manage your assigned orders</p>
            </div>
          </Link>
          
          <Link to="/writer/submissions" className="writer-action-card">
            <div className="writer-action-icon green">
              <Upload />
            </div>
            <div className="writer-action-text">
              <h4>My Submissions</h4>
              <p>Track submission status</p>
            </div>
          </Link>
          
          <Link to="/writer/analytics" className="writer-action-card">
            <div className="writer-action-icon purple">
              <TrendingUp />
            </div>
            <div className="writer-action-text">
              <h4>Performance</h4>
              <p>View detailed analytics</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
