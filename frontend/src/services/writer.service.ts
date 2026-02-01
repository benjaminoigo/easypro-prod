import apiClient from './api';
import { Writer, User } from '../types';

export interface UpdateWriterData {
  status?: Writer['status'];
  isOnline?: boolean;
}

class WriterService {
  async getWriters(params?: {
    status?: string;
    isOnline?: boolean;
    limit?: number;
    page?: number;
  }): Promise<Writer[]> {
    const response = await apiClient.get<Writer[]>('/writers', { params });
    return response.data;
  }

  async getWriter(id: string): Promise<Writer> {
    const response = await apiClient.get<Writer>(`/writers/${id}`);
    return response.data;
  }

  async getWriterProfile(): Promise<Writer> {
    const response = await apiClient.get<Writer>('/writers/profile');
    return response.data;
  }

  async updateWriter(id: string, data: UpdateWriterData): Promise<Writer> {
    const response = await apiClient.patch<Writer>(`/writers/${id}`, data);
    return response.data;
  }

  async updateWriterStatus(id: string, status: Writer['status']): Promise<Writer> {
    const response = await apiClient.patch<Writer>(`/writers/${id}/status`, { status });
    return response.data;
  }

  async getWriterOrders(id: string): Promise<any[]> {
    const response = await apiClient.get(`/writers/${id}/orders`);
    return response.data;
  }

  async getWriterSubmissions(id: string): Promise<any[]> {
    const response = await apiClient.get(`/writers/${id}/submissions`);
    return response.data;
  }

  async getWriterPayments(id: string): Promise<any[]> {
    const response = await apiClient.get(`/writers/${id}/payments`);
    return response.data;
  }

  async generateInviteLink(): Promise<{ inviteToken: string; inviteUrl: string }> {
    const response = await apiClient.post('/auth/invite');
    return response.data;
  }

  async getPendingWriters(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users?status=pending');
    return response.data;
  }

  async approveWriter(userId: string): Promise<User> {
    const response = await apiClient.put<User>(`/auth/approve/${userId}`);
    return response.data;
  }

  async rejectWriter(userId: string): Promise<void> {
    await apiClient.delete(`/auth/reject/${userId}`);
  }

  async setOnlineStatus(isOnline: boolean): Promise<Writer> {
    const response = await apiClient.patch<Writer>('/writers/online-status', { isOnline });
    return response.data;
  }
}

const writerService = new WriterService();
export default writerService;
