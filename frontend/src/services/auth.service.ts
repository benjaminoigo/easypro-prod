import apiClient from './api';
import { AuthResponse, User } from '../types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'writer';
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterData, inviteToken?: string): Promise<User> {
    const url = inviteToken ? `/auth/register?invite=${inviteToken}` : '/auth/register';
    const response = await apiClient.post<User>(url, data);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/auth/profile');
    return response.data.user;
  }

  async generateInvite(): Promise<{ inviteToken: string; inviteUrl: string }> {
    const response = await apiClient.post('/auth/invite');
    return response.data;
  }

  async approveUser(userId: string): Promise<User> {
    const response = await apiClient.put<User>(`/auth/approve/${userId}`);
    return response.data;
  }

  async rejectUser(userId: string): Promise<void> {
    await apiClient.delete(`/auth/reject/${userId}`);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setAuthData(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

const authService = new AuthService();
export default authService;