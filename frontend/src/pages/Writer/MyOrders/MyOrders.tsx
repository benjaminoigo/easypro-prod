import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Clock,
  DollarSign,
  Upload,
  Eye,
  Calendar,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react';
import { Order } from '../../../types';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import SubmitWorkForm, { SubmitWorkFormData } from '../../../components/writer/SubmitWorkForm';
import './MyOrders.css';

interface NewOrderForm {
  orderNumber: string;
  subject: string;
  deadline: string;
  pages: number;
  cpp: number;
  instructions: string;
}

interface WriterLimits {
  currentShiftPages: number;
  currentShiftOrders: number;
  maxPagesPerShift: number;
  hasReachedLimit: boolean;
  remainingPages: number;
}

interface ShiftProgress {
  targetPages: number;
  approvedPages: number;
  pendingPages: number;
  percentComplete: number;
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [writerLimits, setWriterLimits] = useState<WriterLimits>({
    currentShiftPages: 0,
    currentShiftOrders: 0,
    maxPagesPerShift: 20,
    hasReachedLimit: false,
    remainingPages: 20,
  });
  const [shiftProgress, setShiftProgress] = useState<ShiftProgress | null>(null);
  const [shiftProgressLoading, setShiftProgressLoading] = useState(true);
  const [newOrder, setNewOrder] = useState<NewOrderForm>({
    orderNumber: '',
    subject: '',
    deadline: '',
    pages: 1,
    cpp: 3.00,
    instructions: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchShiftProgress();
    const interval = setInterval(fetchShiftProgress, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const [ordersRes, profileRes] = await Promise.all([
        api.get('/orders/my-orders'),
        api.get('/writers/me'),
      ]);
      setOrders(ordersRes.data);
      
      if (profileRes.data) {
        setWriterLimits({
          currentShiftPages: profileRes.data.currentShiftPages || 0,
          currentShiftOrders: profileRes.data.currentShiftOrders || 0,
          maxPagesPerShift: profileRes.data.maxPagesPerShift || 20,
          hasReachedLimit: profileRes.data.hasReachedLimit || false,
          remainingPages: profileRes.data.remainingPages || 20,
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftProgress = async () => {
    try {
      const response = await api.get('/shifts/my-progress');
      setShiftProgress({
        targetPages: Number(response.data.targetPages) || 0,
        approvedPages: Number(response.data.approvedPages) || 0,
        pendingPages: Number(response.data.pendingPages) || 0,
        percentComplete: Number(response.data.percentComplete) || 0,
      });
    } catch (error) {
      console.error('Error fetching shift progress:', error);
    } finally {
      setShiftProgressLoading(false);
    }
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.subject || !newOrder.deadline || !newOrder.pages) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if adding this order would exceed the limit
    if (writerLimits.currentShiftPages + newOrder.pages > writerLimits.maxPagesPerShift) {
      toast.error(`Cannot add order: Would exceed your shift limit of ${writerLimits.maxPagesPerShift} pages. You have ${writerLimits.remainingPages} pages remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/orders/register', {
        orderNumber: newOrder.orderNumber || undefined,
        subject: newOrder.subject,
        deadline: newOrder.deadline,
        pages: newOrder.pages,
        cpp: newOrder.cpp,
        instructions: newOrder.instructions || undefined,
      });
      toast.success('Order registered successfully');
      setShowAddModal(false);
      setNewOrder({
        orderNumber: '',
        subject: '',
        deadline: '',
        pages: 1,
        cpp: 3.00,
        instructions: '',
      });
      fetchOrders();
    } catch (error: any) {
      console.error('Error registering order:', error);
      toast.error(error.response?.data?.message || 'Failed to register order');
    } finally {
      setSubmitting(false);
    }
  };

  const getOrderPriority = (deadline: string) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const hoursLeft = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 24) return 'high';
    if (hoursLeft < 72) return 'medium';
    return 'low';
  };

  const formatTimeLeft = (deadline: string) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const diff = dueDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in-progress';
      case 'pending':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleSubmitWork = (order: Order) => {
    setSelectedOrder(order);
    setShowSubmitModal(true);
  };

  const handleSubmitWorkSubmit = async (data: SubmitWorkFormData) => {
    if (!selectedOrder) return;
    
    console.log('Submitting work:', data, 'for order:', selectedOrder);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', selectedOrder.id);
      formData.append('pagesWorked', data.pagesWorked.toString());
      formData.append('cpp', (Number(selectedOrder.cpp) || 3.00).toString());
      if (data.notes) formData.append('notes', data.notes);
      if (data.file) formData.append('files', data.file);

      console.log('FormData orderId:', selectedOrder.id);
      console.log('FormData pagesWorked:', data.pagesWorked);
      console.log('FormData cpp:', Number(selectedOrder.cpp) || 3.00);

      const response = await api.post(`/submissions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Submission response:', response.data);

      toast.success('Work submitted successfully!');
      setShowSubmitModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error submitting work:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="writer-loading">
        <div className="writer-loading-spinner"></div>
      </div>
    );
  }

  const progressPages = shiftProgress?.approvedPages ?? writerLimits.currentShiftPages;
  const progressTarget = shiftProgress?.targetPages ?? writerLimits.maxPagesPerShift;
  const progressPercent = progressTarget > 0
    ? Math.min((progressPages / progressTarget) * 100, 100)
    : 0;

  return (
    <div className="my-orders-page">
      {/* Shift Limit Tracker */}
      <div className={`shift-limit-tracker ${writerLimits.hasReachedLimit ? 'at-limit' : writerLimits.currentShiftPages >= writerLimits.maxPagesPerShift * 0.8 ? 'near-limit' : ''}`}>
        <div className="limit-info">
          <span className="limit-label">Shift Progress (Approved):</span>
          <span className="limit-value">
            {progressPages} / {progressTarget} pages
          </span>
          <span className="pages-info">
            {shiftProgressLoading
              ? '(updating...)'
              : shiftProgress
                ? `${shiftProgress.pendingPages} pending`
                : `#${writerLimits.currentShiftOrders} orders`}
          </span>
        </div>
        <div className="limit-bar">
          <div 
            className="limit-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {writerLimits.hasReachedLimit && (
          <div className="limit-warning">
            ⚠️ You've reached your shift limit! Cannot register new orders.
          </div>
        )}
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="header-actions">
          <div className="orders-summary">
            <span className="summary-item">
              <FileText />
              {orders.length} total orders
            </span>
            <span className="summary-item urgent">
              <Clock />
              {orders.filter(o => getOrderPriority(o.deadline) === 'high').length} urgent
            </span>
          </div>
          <button 
            className={`btn-primary add-order-btn ${writerLimits.hasReachedLimit ? 'disabled' : ''}`}
            onClick={() => !writerLimits.hasReachedLimit && setShowAddModal(true)}
            disabled={writerLimits.hasReachedLimit}
            title={writerLimits.hasReachedLimit ? 'You have reached your shift limit' : 'Register a new order'}
          >
            <Plus />
            Register Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search />
          <input
            type="text"
            placeholder="Search orders..."
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
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <FileText />
            <h3>No orders found</h3>
            <p>You don't have any assigned orders yet</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const priority = getOrderPriority(order.deadline);
            const timeLeft = formatTimeLeft(order.deadline);
            
            return (
              <div key={order.id} className={`order-row ${priority}`}>
                <div className="order-row-left">
                  <span className={`priority-indicator ${priority}`}></span>
                  <div className="order-info-main">
                    <div className="order-title-row">
                      <h3 className="order-title">{order.subject}</h3>
                      <span className="order-number">#{order.orderNumber}</span>
                    </div>
                    <div className="order-meta-row">
                      <span className="meta-item">
                        <FileText />
                        {order.pages} pages
                      </span>
                      <span className="meta-item">
                        <DollarSign />
                        {formatUSD(order.totalAmount || order.pages * order.cpp)}
                      </span>
                      <span className="meta-item">
                        <Calendar />
                        {new Date(order.deadline).toLocaleDateString()}
                      </span>
                      <span className={`time-left ${priority}`}>
                        <Clock />
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="order-row-right">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <div className="order-actions">
                    <button 
                      className="btn-action btn-view"
                      onClick={() => handleViewDetails(order)}
                      title="View Details"
                    >
                      <Eye />
                      View
                    </button>
                    <button 
                      className="btn-action btn-submit"
                      onClick={() => handleSubmitWork(order)}
                      title="Submit Work"
                    >
                      <Upload />
                      Submit
                    </button>
                  </div>
                  <ChevronRight className="row-chevron" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content add-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register External Order</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleAddOrder}>
              <div className="form-group">
                <label>Order Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., ORD-12345"
                  value={newOrder.orderNumber}
                  onChange={(e) => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
                />
                <span className="hint">Leave blank to auto-generate</span>
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  placeholder="e.g., Essay on Climate Change"
                  value={newOrder.subject}
                  onChange={(e) => setNewOrder({ ...newOrder, subject: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pages *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newOrder.pages}
                    onChange={(e) => setNewOrder({ ...newOrder, pages: parseFloat(e.target.value) || 1 })}
                    required
                  />
                  {writerLimits.remainingPages < newOrder.pages && (
                    <span className="warning-text">
                      ⚠️ Exceeds remaining pages ({writerLimits.remainingPages})
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>CPP (KSh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newOrder.cpp}
                    onChange={(e) => setNewOrder({ ...newOrder, cpp: parseFloat(e.target.value) || 3.00 })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Deadline *</label>
                <input
                  type="datetime-local"
                  value={newOrder.deadline}
                  onChange={(e) => setNewOrder({ ...newOrder, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Instructions (Optional)</label>
                <textarea
                  placeholder="Any special instructions..."
                  rows={3}
                  value={newOrder.instructions}
                  onChange={(e) => setNewOrder({ ...newOrder, instructions: e.target.value })}
                />
              </div>
              <div className="total-preview">
                <span>Estimated Earnings:</span>
                <strong>{formatUSD(newOrder.pages * newOrder.cpp)}</strong>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>
                <X />
              </button>
            </div>
            <div className="order-details-content">
              <div className="detail-row">
                <span className="detail-label">Order Number</span>
                <span className="detail-value">#{selectedOrder.orderNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Subject</span>
                <span className="detail-value">{selectedOrder.subject}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pages</span>
                <span className="detail-value">{selectedOrder.pages || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Rate (CPP)</span>
                <span className="detail-value">{formatUSD(Number(selectedOrder.cpp) || 3.00)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Amount</span>
                <span className="detail-value highlight">{formatUSD(selectedOrder.totalAmount || (selectedOrder.pages || 0) * (Number(selectedOrder.cpp) || 3.00))}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Deadline</span>
                <span className="detail-value">
                  {new Date(selectedOrder.deadline).toLocaleString()}
                  <span className={`time-badge ${getOrderPriority(selectedOrder.deadline)}`}>
                    {formatTimeLeft(selectedOrder.deadline)}
                  </span>
                </span>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Instructions</span>
                <p className="detail-instructions">
                  {selectedOrder.instructions || 'No instructions provided'}
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setShowViewModal(false);
                  handleSubmitWork(selectedOrder);
                }}
              >
                <Upload />
                Submit Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {showSubmitModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content submit-work-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Work</h2>
              <button className="close-btn" onClick={() => setShowSubmitModal(false)}>
                <X />
              </button>
            </div>
            <SubmitWorkForm
              orderId={selectedOrder.orderNumber}
              orderTitle={selectedOrder.subject}
              orderPages={selectedOrder.pages || 1}
              cpp={Number(selectedOrder.cpp) || 3.00}
              onSubmit={handleSubmitWorkSubmit}
              onCancel={() => setShowSubmitModal(false)}
              isLoading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
