import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Star,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import './Analytics.css';

interface WriterAnalytics {
  totalEarnings: number;
  totalOrders: number;
  completionRate: number;
  averageRating: number;
  earningsGrowth: number;
  ordersGrowth: number;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState<WriterAnalytics>({
    totalEarnings: 0,
    totalOrders: 0,
    completionRate: 0,
    averageRating: 0,
    earningsGrowth: 0,
    ordersGrowth: 0,
  });

  // Sample data for charts
  const earningsData = [
    { week: 'Week 1', earnings: 450 },
    { week: 'Week 2', earnings: 520 },
    { week: 'Week 3', earnings: 380 },
    { week: 'Week 4', earnings: 650 },
  ];

  const ordersData = [
    { month: 'Jan', completed: 8, pending: 2 },
    { month: 'Feb', completed: 12, pending: 3 },
    { month: 'Mar', completed: 10, pending: 1 },
    { month: 'Apr', completed: 15, pending: 2 },
    { month: 'May', completed: 18, pending: 4 },
    { month: 'Jun', completed: 20, pending: 3 },
  ];

  const ratingData = [
    { month: 'Jan', rating: 4.2 },
    { month: 'Feb', rating: 4.3 },
    { month: 'Mar', rating: 4.5 },
    { month: 'Apr', rating: 4.4 },
    { month: 'May', rating: 4.6 },
    { month: 'Jun', rating: 4.7 },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/my-analytics?range=${dateRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock data for demo
      setAnalytics({
        totalEarnings: 2850,
        totalOrders: 45,
        completionRate: 92,
        averageRating: 4.7,
        earningsGrowth: 15.5,
        ordersGrowth: 8.2,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="writer-loading">
        <div className="writer-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="writer-analytics-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">My Analytics</h1>
          <p className="page-subtitle">Track your performance and earnings</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="date-select"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="stat-icon green">
            <DollarSign />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Earnings</span>
            <span className="stat-value">{formatUSD(analytics.totalEarnings)}</span>
            <span className={`stat-change ${analytics.earningsGrowth >= 0 ? 'positive' : 'negative'}`}>
              {analytics.earningsGrowth >= 0 ? <TrendingUp /> : <TrendingDown />}
              {Math.abs(analytics.earningsGrowth)}% vs last period
            </span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon blue">
            <FileText />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed Orders</span>
            <span className="stat-value">{analytics.totalOrders}</span>
            <span className={`stat-change ${analytics.ordersGrowth >= 0 ? 'positive' : 'negative'}`}>
              {analytics.ordersGrowth >= 0 ? <TrendingUp /> : <TrendingDown />}
              {Math.abs(analytics.ordersGrowth)}% vs last period
            </span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon yellow">
            <Clock />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completion Rate</span>
            <span className="stat-value">{analytics.completionRate}%</span>
            <span className="stat-change positive">
              <TrendingUp />
              +2% vs last period
            </span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon purple">
            <Star />
          </div>
          <div className="stat-content">
            <span className="stat-label">Average Rating</span>
            <span className="stat-value">{analytics.averageRating.toFixed(1)}</span>
            <span className="stat-change positive">
              <TrendingUp />
              +0.2 vs last period
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Earnings']}
                contentStyle={{ 
                  background: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Orders Completed</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="completed" fill="#667eea" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3 className="chart-title">Rating History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis domain={[0, 5]} stroke="#94a3b8" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
                name="Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
