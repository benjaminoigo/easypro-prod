import apiClient from './api';
import { Order, Submission } from '../types';

export interface CreateOrderData {
  title: string;
  subject: string;
  deadline: string;
  pages: number;
  wordCount?: number;
  cpp: number;
  writerId?: string;
}

export interface UpdateOrderData {
  title?: string;
  subject?: string;
  deadline?: string;
  pages?: number;
  wordCount?: number;
  cpp?: number;
  writerId?: string;
  status?: Order['status'];
}

class OrderService {
  async getOrders(params?: { 
    status?: string; 
    writerId?: string; 
    limit?: number;
    page?: number;
  }): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/orders', { params });
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  }

  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  }

  async updateOrder(id: string, data: UpdateOrderData): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}`, data);
    return response.data;
  }

  async deleteOrder(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  }

  async assignOrder(id: string, writerId: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/assign`, { writerId });
    return response.data;
  }

  async cancelOrder(id: string, reason: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/cancel`, { reason });
    return response.data;
  }

  async getAssignedOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/orders/assigned');
    return response.data;
  }

  async submitWork(orderId: string, data: { pagesWorked: number; notes?: string; file?: File }): Promise<Submission> {
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('pagesWorked', data.pagesWorked.toString());
    if (data.notes) formData.append('notes', data.notes);
    if (data.file) formData.append('file', data.file);

    const response = await apiClient.post<Submission>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

const orderService = new OrderService();
export default orderService;
