import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import './Analytics.css';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalWriters: number;
  avgOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalWriters: 0,
    avgOrderValue: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  });

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12000, orders: 45 },
    { month: 'Feb', revenue: 15000, orders: 52 },
    { month: 'Mar', revenue: 18000, orders: 61 },
    { month: 'Apr', revenue: 22000, orders: 78 },
    { month: 'May', revenue: 25000, orders: 85 },
    { month: 'Jun', revenue: 28000, orders: 92 },
  ];

  const orderStatusData = [
    { name: 'Completed', value: 68, color: '#10b981' },
    { name: 'In Progress', value: 18, color: '#3b82f6' },
    { name: 'Pending', value: 10, color: '#f59e0b' },
    { name: 'Cancelled', value: 4, color: '#ef4444' },
  ];

  const writerPerformanceData = [
    { name: 'Week 1', avgRating: 4.2, completionRate: 85 },
    { name: 'Week 2', avgRating: 4.4, completionRate: 88 },
    { name: 'Week 3', avgRating: 4.3, completionRate: 90 },
    { name: 'Week 4', avgRating: 4.6, completionRate: 92 },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/admin-dashboard?range=${dateRange}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock data for demo
      setAnalyticsData({
        totalRevenue: 125000,
        totalOrders: 485,
        totalWriters: 32,
        avgOrderValue: 258,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
      });
    } finally {
      setLoading(false);
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
    <div className="analytics-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Track your business performance</p>
        </div>
        <div className="header-right">
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
          <button className="export-btn">
            <Download />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="stat-icon green">
            <DollarSign />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">{formatUSD(analyticsData.totalRevenue)}</span>
            <span className={`stat-change ${analyticsData.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.revenueGrowth >= 0 ? <TrendingUp /> : <TrendingDown />}
              {Math.abs(analyticsData.revenueGrowth)}% vs last period
            </span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon blue">
            <FileText />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{analyticsData.totalOrders}</span>
            <span className={`stat-change ${analyticsData.ordersGrowth >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.ordersGrowth >= 0 ? <TrendingUp /> : <TrendingDown />}
              {Math.abs(analyticsData.ordersGrowth)}% vs last period
            </span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon purple">
            <Users />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Writers</span>
            <span className="stat-value">{analyticsData.totalWriters}</span>
            <span className="stat-change positive">
              <TrendingUp />
              3 new this month
            </span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon yellow">
            <Calendar />
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg. Order Value</span>
            <span className="stat-value">{formatUSD(analyticsData.avgOrderValue)}</span>
            <span className="stat-change positive">
              <TrendingUp />
              5.2% vs last period
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        <div className="chart-card large">
          <h3 className="chart-title">Revenue & Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#667eea" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Writer Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={writerPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#10b981" radius={[4, 4, 0, 0]} name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Average Rating Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={writerPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis domain={[0, 5]} stroke="#94a3b8" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="avgRating" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
                name="Avg Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
