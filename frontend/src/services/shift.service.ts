import apiClient from './api';
import { Shift } from '../types';

export interface CreateShiftData {
  startTime: string;
  endTime: string;
  maxPagesPerShift?: number;
}

export interface UpdateShiftData {
  maxPagesPerShift?: number;
  isActive?: boolean;
}

class ShiftService {
  async getShifts(params?: {
    isActive?: boolean;
    limit?: number;
    page?: number;
  }): Promise<Shift[]> {
    const response = await apiClient.get<Shift[]>('/shifts', { params });
    return response.data;
  }

  async getCurrentShift(): Promise<Shift | null> {
    try {
      const response = await apiClient.get<Shift>('/shifts/current');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getShift(id: string): Promise<Shift> {
    const response = await apiClient.get<Shift>(`/shifts/${id}`);
    return response.data;
  }

  async createShift(data: CreateShiftData): Promise<Shift> {
    const response = await apiClient.post<Shift>('/shifts', data);
    return response.data;
  }

  async updateShift(id: string, data: UpdateShiftData): Promise<Shift> {
    const response = await apiClient.patch<Shift>(`/shifts/${id}`, data);
    return response.data;
  }

  async deleteShift(id: string): Promise<void> {
    await apiClient.delete(`/shifts/${id}`);
  }

  async activateShift(id: string): Promise<Shift> {
    const response = await apiClient.patch<Shift>(`/shifts/${id}/activate`);
    return response.data;
  }

  async deactivateShift(id: string): Promise<Shift> {
    const response = await apiClient.patch<Shift>(`/shifts/${id}/deactivate`);
    return response.data;
  }

  async getShiftStats(id: string): Promise<{
    totalSubmissions: number;
    totalPages: number;
    totalAmount: number;
    writerCount: number;
  }> {
    const response = await apiClient.get(`/shifts/${id}/stats`);
    return response.data;
  }
}

const shiftService = new ShiftService();
export default shiftService;
