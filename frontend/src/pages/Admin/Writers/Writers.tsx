import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Star,
  Copy,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { Writer } from '../../../types';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import './Writers.css';

const Writers: React.FC = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteExpiry, setInviteExpiry] = useState<Date | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [resetExpiry, setResetExpiry] = useState<Date | null>(null);
  const [resettingFor, setResettingFor] = useState<Writer | null>(null);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchWriters();
  }, []);

  useEffect(() => {
    const handleClose = () => setOpenMenuId(null);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, []);

  const fetchWriters = async () => {
    try {
      const response = await api.get('/writers');
      setWriters(response.data);
    } catch (error) {
      console.error('Error fetching writers:', error);
      toast.error('Failed to load writers');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteWriter = async () => {
    setGeneratingLink(true);
    try {
      const response = await api.post('/auth/invite');
      setInviteLink(response.data.inviteUrl);
      setInviteExpiry(new Date(response.data.expiresAt));
      toast.success('Invite link generated successfully');
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleGenerateResetOtp = async (writer: Writer) => {
    if (!writer.user?.id) {
      toast.error('User record not found for this writer');
      return;
    }
    setGeneratingOtp(true);
    try {
      const response = await api.post(`/auth/reset-otp/${writer.user.id}`);
      setResetOtp(response.data.otp);
      setResetExpiry(new Date(response.data.expiresAt));
      setResettingFor(writer);
      setShowResetModal(true);
      toast.success('OTP generated successfully');
    } catch (error) {
      console.error('Error generating OTP:', error);
      toast.error('Failed to generate OTP');
    } finally {
      setGeneratingOtp(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link. Please copy manually.');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleOpenModal = () => {
    setInviteLink('');
    setInviteExpiry(null);
    setShowInviteModal(true);
  };

  const formatExpiry = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleStatus = async (writerId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await api.put(`/writers/${writerId}/status`, { 
        status: newStatus,
        reason: newStatus === 'active' ? 'Activated by admin' : 'Suspended by admin'
      });
      toast.success(`Writer ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      fetchWriters();
    } catch (error) {
      console.error('Error updating writer status:', error);
      toast.error('Failed to update writer status');
    }
  };

  const filteredWriters = writers.filter((writer) => {
    const matchesSearch = 
      writer.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      writer.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      writer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && writer.status === 'active') ||
      (statusFilter === 'inactive' && writer.status !== 'active') ||
      (statusFilter === 'online' && writer.isOnline);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="writers-page">
      {/* Header */}
      <div className="page-header">
        <button className="invite-btn" onClick={handleOpenModal}>
          <UserPlus />
          Invite Writer
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search />
          <input
            type="text"
            placeholder="Search writers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="online">Online Now</option>
          </select>
        </div>
      </div>

      {/* Writers Table */}
      <div className="writers-table-card">
        <table className="writers-table">
          <thead>
            <tr>
              <th>Writer</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Rating</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWriters.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No writers found
                </td>
              </tr>
            ) : (
              filteredWriters.map((writer) => (
                <tr key={writer.id}>
                  <td>
                    <div className="writer-info">
                      <div className="writer-avatar">
                        {writer.user?.firstName?.[0]}{writer.user?.lastName?.[0]}
                      </div>
                      <div className="writer-details">
                        <h4>{writer.user?.firstName} {writer.user?.lastName}</h4>
                        <p>{writer.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="status-badges">
                      <span className={`status-badge ${writer.status === 'active' ? 'active' : 'inactive'}`}>
                        {writer.status === 'active' ? <CheckCircle /> : <XCircle />}
                        {writer.status === 'active' ? 'Active' : writer.status === 'probation' ? 'Probation' : 'Suspended'}
                      </span>
                      {writer.isOnline && (
                        <span className="status-badge online">
                          <Clock />
                          Online
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="orders-info">
                      <span className="completed">{writer.completedOrders || 0} completed</span>
                      <span className="total">{writer.totalOrders || 0} total</span>
                    </div>
                  </td>
                  <td>
                    <div className="rating-info">
                      <Star className="star-icon" />
                      <span>{(writer.averageRating || 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="balance-info">
                      <DollarSign />
                      <span>{formatUSD(writer.currentBalance || 0)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === writer.id ? null : writer.id);
                        }}
                      >
                        <MoreVertical />
                      </button>
                      {openMenuId === writer.id && (
                        <div
                          className="action-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className={`menu-item ${writer.status === 'active' ? 'danger' : 'success'}`}
                            onClick={() => {
                              setOpenMenuId(null);
                              handleToggleStatus(writer.id, writer.status);
                            }}
                          >
                            {writer.status === 'active' ? 'Suspend Writer' : 'Activate Writer'}
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleGenerateResetOtp(writer);
                            }}
                            disabled={generatingOtp}
                          >
                            Reset Password
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Invite New Writer</h2>
            <p>Generate a unique registration link for a new writer</p>
            
            {!inviteLink ? (
              <div className="invite-generate-section">
                <div className="invite-info">
                  <LinkIcon className="invite-icon" />
                  <p>Click the button below to generate a secure invite link. The link will expire in 48 hours.</p>
                </div>
                <button 
                  className="btn-primary generate-btn" 
                  onClick={handleInviteWriter}
                  disabled={generatingLink}
                >
                  {generatingLink ? (
                    <>
                      <RefreshCw className="spinning" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon />
                      Generate Invite Link
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="invite-link-section">
                <label>Registration Link</label>
                <div className="link-container">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="link-input"
                  />
                  <button className="copy-btn" onClick={handleCopyLink}>
                    <Copy />
                  </button>
                </div>
                {inviteExpiry && (
                  <p className="expiry-info">
                    <Clock />
                    Expires: {formatExpiry(inviteExpiry)}
                  </p>
                )}
                <div className="invite-instructions">
                  <h4>Next Steps:</h4>
                  <ol>
                    <li>Share this link with the writer</li>
                    <li>Writer completes registration form</li>
                    <li>Review and approve the writer in Pending Approvals</li>
                  </ol>
                </div>
                <button 
                  className="btn-secondary generate-new-btn" 
                  onClick={handleInviteWriter}
                  disabled={generatingLink}
                >
                  <RefreshCw className={generatingLink ? 'spinning' : ''} />
                  Generate New Link
                </button>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reset Password OTP</h2>
            <p>
              Share this OTP with {resettingFor?.user?.firstName} {resettingFor?.user?.lastName}.
              It expires in 5 minutes.
            </p>
            <div className="invite-link-section">
              <label>One-Time Password</label>
              <div className="link-container">
                <input type="text" value={resetOtp} readOnly className="link-input" />
                <button className="copy-btn" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(resetOtp);
                    toast.success('OTP copied to clipboard!');
                  } catch (error) {
                    toast.error('Failed to copy OTP');
                  }
                }}>
                  <Copy />
                </button>
              </div>
              {resetExpiry && (
                <p className="expiry-info">
                  <Clock />
                  Expires: {formatExpiry(resetExpiry)}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowResetModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Writers;
