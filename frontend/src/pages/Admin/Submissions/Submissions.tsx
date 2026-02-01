import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Download,
  X,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  User,
  Calendar,
  DollarSign,
  File,
} from 'lucide-react';
import { Submission } from '../../../types';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import { formatUSD } from '../../../utils/formatUSD';
import './Submissions.css';

const AdminSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/submissions');
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
      submission.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.writer?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.writer?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowViewModal(true);
  };

  const handleReviewClick = (submission: Submission, action: 'approve' | 'reject' | 'revision') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedSubmission) return;
    
    setSubmitting(true);
    try {
      const status = reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'revision';
      await api.put(`/submissions/${selectedSubmission.id}/review`, {
        status,
        reviewNotes,
      });
      toast.success(`Submission ${status} successfully!`);
      setShowReviewModal(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      toast.error(error.response?.data?.message || 'Failed to review submission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (submission: Submission) => {
    if (!submission.filePath) {
      toast.error('No file available for download');
      return;
    }
    
    try {
      const fileName = submission.filePath.replace(/^uploads[\\/]/, '');
      const downloadUrl = `http://localhost:3001/api/uploads/${fileName}`;
      
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
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-submissions-page">
      {/* Header */}
      

      {/* Stats */}
      <div className="submissions-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FileText />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rejected">
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
            placeholder="Search by order, writer..."
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
            <option value="revision">Revision</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="submissions-table-card">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Writer</th>
              <th>Pages</th>
              <th>Amount</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No submissions found
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <div className="order-info">
                      <FileText className="order-icon" />
                      <div>
                        <span className="order-subject">{submission.order?.subject || 'N/A'}</span>
                        <span className="order-number">#{submission.order?.orderNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="writer-info">
                      <User className="writer-icon" />
                      <span>
                        {submission.writer?.user?.firstName} {submission.writer?.user?.lastName}
                      </span>
                    </div>
                  </td>
                  <td>{submission.pagesWorked}</td>
                  <td className="amount">{formatUSD(Number(submission.amount) || 0)}</td>
                  <td>{new Date(submission.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      {submission.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view" 
                        title="View Details"
                        onClick={() => handleViewDetails(submission)}
                      >
                        <Eye />
                      </button>
                      {submission.filePath && (
                        <button 
                          className="action-btn download" 
                          title="Download File"
                          onClick={() => handleDownload(submission)}
                        >
                          <Download />
                        </button>
                      )}
                      {submission.status === 'pending' && (
                        <>
                          <button 
                            className="action-btn approve" 
                            title="Approve"
                            onClick={() => handleReviewClick(submission, 'approve')}
                          >
                            <ThumbsUp />
                          </button>
                          <button 
                            className="action-btn revision" 
                            title="Request Revision"
                            onClick={() => handleReviewClick(submission, 'revision')}
                          >
                            <RotateCcw />
                          </button>
                          <button 
                            className="action-btn reject" 
                            title="Reject"
                            onClick={() => handleReviewClick(submission, 'reject')}
                          >
                            <ThumbsDown />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submission Details</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Order Information</h3>
                <div className="detail-row">
                  <span className="label">Order Number</span>
                  <span className="value">#{selectedSubmission.order?.orderNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Subject</span>
                  <span className="value">{selectedSubmission.order?.subject}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Writer Information</h3>
                <div className="detail-row">
                  <span className="label">Name</span>
                  <span className="value">
                    {selectedSubmission.writer?.user?.firstName} {selectedSubmission.writer?.user?.lastName}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Email</span>
                  <span className="value">{selectedSubmission.writer?.user?.email}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Submission Details</h3>
                <div className="detail-row">
                  <span className="label">Status</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedSubmission.status)}`}>
                    {getStatusIcon(selectedSubmission.status)}
                    {selectedSubmission.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Pages Worked</span>
                  <span className="value">{selectedSubmission.pagesWorked}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Rate (CPP)</span>
                  <span className="value">{formatUSD(Number(selectedSubmission.cpp) || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount</span>
                  <span className="value highlight">{formatUSD(Number(selectedSubmission.amount) || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Submitted On</span>
                  <span className="value">{new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedSubmission.notes && (
                <div className="detail-section">
                  <h3>Writer Notes</h3>
                  <p className="notes-text">{selectedSubmission.notes}</p>
                </div>
              )}

              {selectedSubmission.filePath && (
                <div className="detail-section">
                  <h3>Uploaded File</h3>
                  <div className="file-card">
                    <File className="file-icon" />
                    <div className="file-info">
                      <span className="file-name">{selectedSubmission.fileName || 'Submission File'}</span>
                      <button 
                        className="download-link"
                        onClick={() => handleDownload(selectedSubmission)}
                      >
                        <Download /> Download
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedSubmission.reviewNotes && (
                <div className="detail-section">
                  <h3>Review Notes</h3>
                  <p className="notes-text review">{selectedSubmission.reviewNotes}</p>
                  {selectedSubmission.reviewedAt && (
                    <span className="reviewed-at">
                      Reviewed on: {new Date(selectedSubmission.reviewedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              {selectedSubmission.status === 'pending' && (
                <>
                  <button 
                    className="btn-success"
                    onClick={() => {
                      setShowViewModal(false);
                      handleReviewClick(selectedSubmission, 'approve');
                    }}
                  >
                    <ThumbsUp /> Approve
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => {
                      setShowViewModal(false);
                      handleReviewClick(selectedSubmission, 'reject');
                    }}
                  >
                    <ThumbsDown /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {reviewAction === 'approve' && 'Approve Submission'}
                {reviewAction === 'reject' && 'Reject Submission'}
                {reviewAction === 'revision' && 'Request Revision'}
              </h2>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div className="review-summary">
                <p><strong>Order:</strong> {selectedSubmission.order?.subject}</p>
                <p><strong>Writer:</strong> {selectedSubmission.writer?.user?.firstName} {selectedSubmission.writer?.user?.lastName}</p>
                <p><strong>Amount:</strong> {formatUSD(Number(selectedSubmission.amount) || 0)}</p>
              </div>
              <div className="form-group">
                <label>Review Notes {reviewAction !== 'approve' && '*'}</label>
                <textarea
                  placeholder={
                    reviewAction === 'approve' 
                      ? 'Optional feedback for the writer...'
                      : 'Please provide feedback for the writer...'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  required={reviewAction !== 'approve'}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button 
                className={`btn-${reviewAction === 'approve' ? 'success' : reviewAction === 'reject' ? 'danger' : 'warning'}`}
                onClick={handleReviewSubmit}
                disabled={submitting || (reviewAction !== 'approve' && !reviewNotes.trim())}
              >
                {submitting ? 'Processing...' : (
                  <>
                    {reviewAction === 'approve' && <><ThumbsUp /> Approve</>}
                    {reviewAction === 'reject' && <><ThumbsDown /> Reject</>}
                    {reviewAction === 'revision' && <><RotateCcw /> Request Revision</>}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubmissions;
