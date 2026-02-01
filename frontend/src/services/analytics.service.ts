import apiClient from './api';
import { DashboardStats, ChartData, WriterEarnings } from '../types';

class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/analytics/dashboard');
    return response.data;
  }

  async getOrdersChart(period: 'week' | 'month' | 'year' = 'week'): Promise<ChartData[]> {
    const response = await apiClient.get<ChartData[]>('/analytics/orders-chart', {
      params: { period },
    });
    return response.data;
  }

  async getRevenueChart(period: 'week' | 'month' | 'year' = 'week'): Promise<ChartData[]> {
    const response = await apiClient.get<ChartData[]>('/analytics/revenue-chart', {
      params: { period },
    });
    return response.data;
  }

  async getWriterEarnings(period: 'week' | 'month' | 'year' = 'month'): Promise<WriterEarnings[]> {
    const response = await apiClient.get<WriterEarnings[]>('/analytics/writer-earnings', {
      params: { period },
    });
    return response.data;
  }

  async getOrderStatusBreakdown(): Promise<{ status: string; count: number; percentage: number }[]> {
    const response = await apiClient.get('/analytics/order-status');
    return response.data;
  }

  async getWriterPerformance(writerId?: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    onTimeDeliveryRate: number;
    averageRating: number;
    totalEarnings: number;
    thisMonthEarnings: number;
  }> {
    const response = await apiClient.get('/analytics/writer-performance', {
      params: writerId ? { writerId } : undefined,
    });
    return response.data;
  }

  async getShiftAnalytics(shiftId?: string): Promise<{
    totalSubmissions: number;
    totalPages: number;
    totalAmount: number;
    activeWriters: number;
  }> {
    const response = await apiClient.get('/analytics/shift', {
      params: shiftId ? { shiftId } : undefined,
    });
    return response.data;
  }

  async exportReport(type: 'orders' | 'payments' | 'writers', format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/analytics/export/${type}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
