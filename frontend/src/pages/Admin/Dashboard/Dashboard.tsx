import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  UserPlus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User, Order } from '../../../types';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import './Dashboard.css';

interface DashboardStats {
  totalWriters: number;
  activeOrders: number;
  completedOrders: number;
  completedThisMonth: number;
  totalRevenue: number;
  pendingPayments: number;
  onlineWriters: number;
  growthRate: number;
}

interface WeeklyOrderData {
  day: string;
  orders: number;
}

interface OrderStatusData {
  name: string;
  value: number;
  color: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWriters: 0,
    activeOrders: 0,
    completedOrders: 0,
    completedThisMonth: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    onlineWriters: 0,
    growthRate: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [weeklyOrders, setWeeklyOrders] = useState<WeeklyOrderData[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        api.get('/analytics/admin-dashboard'),
        api.get('/users?status=pending'),
      ]);

      const { overview, recentActivity, charts } = dashboardRes.data;

      setStats({
        totalWriters: overview.totalWriters || 0,
        activeOrders: overview.activeOrders || 0,
        completedOrders: overview.completedOrders || 0,
        completedThisMonth: overview.completedThisMonth || 0,
        totalRevenue: overview.totalRevenue || 0,
        pendingPayments: overview.totalPayableAmount || 0,
        onlineWriters: overview.onlineWriters || 0,
        growthRate: overview.growthRate || 0,
      });

      setRecentOrders(recentActivity.recentOrders || []);
      setWeeklyOrders(charts.weeklyOrders || []);
      setOrderStatus(charts.orderStatusDistribution || []);
      setPendingUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User rejected successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-actions">
          <Link to="/admin/writers" className="admin-invite-btn">
            <UserPlus />
            Invite Writer
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon blue">
              <Users />
            </div>
            <div className="admin-stat-info">
              <p className="admin-stat-label">Total Writers</p>
              <p className="admin-stat-value">{stats.totalWriters}</p>
            </div>
          </div>
          <div className="admin-stat-footer">
            <span className="positive">{stats.onlineWriters}</span>&nbsp;online now
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon green">
              <FileText />
            </div>
            <div className="admin-stat-info">
              <p className="admin-stat-label">Active Orders</p>
              <p className="admin-stat-value">{stats.activeOrders}</p>
            </div>
          </div>
          <div className="admin-stat-footer">
            {stats.completedThisMonth} completed this month
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon yellow">
              <DollarSign />
            </div>
            <div className="admin-stat-info">
              <p className="admin-stat-label">Total Revenue</p>
              <p className="admin-stat-value">{formatUSD(stats.totalRevenue)}</p>
            </div>
          </div>
          <div className="admin-stat-footer">
            <span className="negative">{formatUSD(stats.pendingPayments)}</span>&nbsp;pending
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon purple">
              <TrendingUp />
            </div>
            <div className="admin-stat-info">
              <p className="admin-stat-label">Growth Rate</p>
              <p className="admin-stat-value">{stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}%</p>
            </div>
          </div>
          <div className="admin-stat-footer">
            <TrendingUp size={14} />&nbsp;<span className={stats.growthRate >= 0 ? 'positive' : 'negative'}>vs last month</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="admin-charts-grid">
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Weekly Orders</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={orderStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {orderStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="admin-chart-legend">
            {orderStatus.map((item, index) => (
              <div key={index} className="admin-legend-item">
                <div className="admin-legend-dot" style={{ backgroundColor: item.color }}></div>
                <span className="admin-legend-label">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="admin-tables-grid">
        {/* Recent Orders */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3 className="admin-table-title">Recent Orders</h3>
          </div>
          <ul className="admin-table-list">
            {recentOrders.map((order) => (
              <li key={order.id} className="admin-table-item">
                <div className="admin-table-item-content">
                  <div className="admin-table-item-left">
                    <div className="admin-table-item-icon">
                      <FileText />
                    </div>
                    <div className="admin-table-item-info">
                      <h4>{order.title}</h4>
                      <p>Due: {new Date(order.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`admin-status-badge ${
                    order.status === 'completed' || order.status === 'submitted'
                      ? 'completed'
                      : order.status === 'in_progress'
                      ? 'in-progress'
                      : 'pending'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="admin-table-footer">
            <Link to="/admin/orders" className="admin-view-all-link">
              View all orders →
            </Link>
          </div>
        </div>

        {/* Pending User Approvals */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3 className="admin-table-title">Pending Approvals</h3>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="admin-empty-state">
              No pending approvals
            </div>
          ) : (
            <ul className="admin-table-list">
              {pendingUsers.map((user) => (
                <li key={user.id} className="admin-table-item">
                  <div className="admin-table-item-content">
                    <div className="admin-table-item-left">
                      <div className="admin-table-item-icon">
                        <Users />
                      </div>
                      <div className="admin-table-item-info">
                        <h4>{user.firstName} {user.lastName}</h4>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="admin-action-buttons">
                      <button
                        onClick={() => approveUser(user.id)}
                        className="admin-action-btn approve"
                      >
                        <CheckCircle />
                        Approve
                      </button>
                      <button
                        onClick={() => rejectUser(user.id)}
                        className="admin-action-btn reject"
                      >
                        <AlertCircle />
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
