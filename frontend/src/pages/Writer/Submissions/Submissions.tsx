import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Download,
  X,
  Calendar,
  File,
} from 'lucide-react';
import { Submission } from '../../../types';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import { formatUSD } from '../../../utils/formatUSD';
import './Submissions.css';

const Submissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/submissions/my-submissions');
      console.log('Fetched submissions:', response.data);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle />;
      case 'rejected':
        return <XCircle />;
      case 'pending':
        return <Clock />;
      case 'revision':
        return <AlertCircle />;
      default:
        return <Clock />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'pending':
        return 'pending';
      case 'revision':
        return 'revision';
      default:
        return 'pending';
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = 
      submission.order?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowViewModal(true);
  };

  const handleDownload = async (submission: Submission) => {
    if (!submission.filePath) {
      toast.error('No file available for download');
      return;
    }
    
    try {
      // Extract just the filename from the path (remove 'uploads\\' or 'uploads/')
      const fileName = submission.filePath.replace(/^uploads[\\/]/, '');
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const downloadUrl = `${apiBaseUrl}/uploads/${fileName}`;
      
      // Open in new tab or trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = submission.fileName || 'submission-file';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const stats = {
    total: submissions.length,
    approved: submissions.filter(s => s.status === 'approved').length,
    pending: submissions.filter(s => s.status === 'pending').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="writer-loading">
        <div className="writer-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="submissions-page">
      {/* Header */}

      {/* Stats */}
      <div className="submissions-stats">
        <div className="stat-item">
          <div className="stat-icon blue">
            <Upload />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Submissions</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon green">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon yellow">
            <Clock />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon red">
            <XCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search />
          <input
            type="text"
            placeholder="Search submissions..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revision">Revision Required</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="submissions-list">
        {filteredSubmissions.length === 0 ? (
          <div className="empty-state">
            <Upload />
            <h3>No submissions found</h3>
            <p>You haven't submitted any work yet</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <div className="submission-main">
                <div className="submission-icon">
                  <FileText />
                </div>
                <div className="submission-info">
                  <h3>{submission.order?.subject || 'Untitled Order'}</h3>
                  <p>Order #{submission.order?.orderNumber} • Submitted: {new Date(submission.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(submission.status)}`}>
                  {getStatusIcon(submission.status)}
                  {submission.status}
                </span>
              </div>
              {submission.feedback && (
                <div className="submission-feedback">
                  <strong>Feedback:</strong> {submission.feedback}
                </div>
              )}
              <div className="submission-actions">
                <button 
                  className="action-btn"
                  onClick={() => handleViewDetails(submission)}
                >
                  <Eye />
                  View Details
                </button>
                {submission.filePath && (
                  <button 
                    className="action-btn"
                    onClick={() => handleDownload(submission)}
                  >
                    <Download />
                    Download
                  </button>
                )}
                {submission.status === 'revision' && (
                  <button className="action-btn primary">
                    <Upload />
                    Resubmit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submission Details</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>
                <X />
              </button>
            </div>
            <div className="submission-details-content">
              <div className="detail-section">
                <h3>Order Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Order Number</span>
                  <span className="detail-value">#{selectedSubmission.order?.orderNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Subject</span>
                  <span className="detail-value">{selectedSubmission.order?.subject || 'N/A'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Submission Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedSubmission.status)}`}>
                    {getStatusIcon(selectedSubmission.status)}
                    {selectedSubmission.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pages Worked</span>
                  <span className="detail-value">{selectedSubmission.pagesWorked}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Rate (CPP)</span>
                  <span className="detail-value">{formatUSD(Number(selectedSubmission.cpp) || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount Earned</span>
                  <span className="detail-value highlight">{formatUSD(Number(selectedSubmission.amount) || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Submitted On</span>
                  <span className="detail-value">
                    <Calendar className="inline-icon" />
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedSubmission.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p className="detail-notes">{selectedSubmission.notes}</p>
                </div>
              )}

              {selectedSubmission.filePath && (
                <div className="detail-section">
                  <h3>Uploaded File</h3>
                  <div className="file-info-card">
                    <File className="file-icon" />
                    <div className="file-details">
                      <span className="file-name">{selectedSubmission.fileName || 'Submission File'}</span>
                      <button 
                        className="download-link"
                        onClick={() => handleDownload(selectedSubmission)}
                      >
                        <Download />
                        Download File
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedSubmission.reviewNotes && (
                <div className="detail-section">
                  <h3>Review Feedback</h3>
                  <p className="detail-notes review-notes">{selectedSubmission.reviewNotes}</p>
                  {selectedSubmission.reviewedAt && (
                    <span className="reviewed-at">
                      Reviewed on: {new Date(selectedSubmission.reviewedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              {selectedSubmission.filePath && (
                <button 
                  className="btn-primary"
                  onClick={() => handleDownload(selectedSubmission)}
                >
                  <Download />
                  Download File
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;
