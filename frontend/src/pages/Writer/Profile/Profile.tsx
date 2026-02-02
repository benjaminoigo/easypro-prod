import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Camera,
  Star,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import './Profile.css';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [writerStats, setWriterStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    averageRating: 0,
    totalEarnings: 0,
    currentBalance: 0,
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/writers/me');
      const { user: userData, ...stats } = response.data;
      setProfileData({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
      });
      setWriterStats({
        totalOrders: stats.totalOrders || 0,
        completedOrders: stats.completedOrders || 0,
        averageRating: stats.averageRating || 0,
        totalEarnings: stats.totalEarnings || 0,
        currentBalance: stats.currentBalance || 0,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/profile', profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
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
    <div className="profile-page">
      {/* Header */}

      {/* Profile Card */}
      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              <span>{profileData.firstName?.[0]}{profileData.lastName?.[0]}</span>
              <button className="avatar-edit">
                <Camera />
              </button>
            </div>
            <h2 className="profile-name">{profileData.firstName} {profileData.lastName}</h2>
            <p className="profile-email">{profileData.email}</p>
            <div className="profile-stats">
              <div className="stat-item">
                <FileText />
                <div>
                  <span className="stat-value">{writerStats.completedOrders}</span>
                  <span className="stat-label">Orders</span>
                </div>
              </div>
              <div className="stat-item">
                <Star />
                <div>
                  <span className="stat-value">{writerStats.averageRating.toFixed(1)}</span>
                  <span className="stat-label">Rating</span>
                </div>
              </div>
              <div className="stat-item">
                <DollarSign />
                <div>
                  <span className="stat-value">{formatUSD(writerStats.currentBalance)}</span>
                  <span className="stat-label">Balance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-content">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User />
              Profile Information
            </button>
            <button
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock />
              Security
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <form className="form-card" onSubmit={handleProfileUpdate}>
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <div className="input-with-icon">
                    <User />
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <div className="input-with-icon">
                    <User />
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled
                  />
                </div>
                <span className="input-hint">Email cannot be changed</span>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <Phone />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form className="form-card" onSubmit={handlePasswordChange}>
              <h3>Change Password</h3>
              <div className="form-group">
                <label>Current Password</label>
                <div className="input-with-icon">
                  <Lock />
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <Lock />
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <span className="input-hint">Must be at least 8 characters</span>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="input-with-icon">
                  <Lock />
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Lock />
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
