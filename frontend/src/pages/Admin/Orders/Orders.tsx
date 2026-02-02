import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Clock,
  DollarSign,
  User,
  Eye,
  Edit,
  Trash2,
  X,
  Calendar,
  Save,
  Upload,
  File,
} from 'lucide-react';
import { Order } from '../../../types';
import api from '../../../services/api';
import { formatUSD } from '../../../utils/formatUSD';
import { toast } from 'react-toastify';
import './Orders.css';

interface Writer {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface OrderFormData {
  subject: string;
  instructions: string;
  deadline: string;
  pages: number;
  cpp: number;
  writerId: string;
  status: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    subject: '',
    instructions: '',
    deadline: '',
    pages: 1,
    cpp: 3.00,
    writerId: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchOrders();
    fetchWriters();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchWriters = async () => {
    try {
      const response = await api.get('/writers');
      setWriters(response.data);
    } catch (error) {
      console.error('Error fetching writers:', error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setFormData({
      subject: order.subject || '',
      instructions: order.instructions || '',
      deadline: order.deadline ? new Date(order.deadline).toISOString().slice(0, 16) : '',
      pages: order.pages || 1,
      cpp: order.cpp || 3.00,
      writerId: order.writerId || '',
      status: order.status || 'pending',
    });
    setShowEditModal(true);
  };

  const handleCreateOrder = () => {
    setFormData({
      subject: '',
      instructions: '',
      deadline: '',
      pages: 1,
      cpp: 3.00,
      writerId: '',
      status: 'pending',
    });
    setSelectedFiles([]);
    setShowCreateModal(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (showEditModal && selectedOrder) {
        await api.patch(`/orders/${selectedOrder.id}`, formData);
        toast.success('Order updated successfully');
        setShowEditModal(false);
      } else {
        // Use FormData for file uploads
        const submitData = new FormData();
        submitData.append('subject', formData.subject);
        submitData.append('deadline', formData.deadline);
        submitData.append('pages', formData.pages.toString());
        submitData.append('cpp', formData.cpp.toString());
        if (formData.instructions) submitData.append('instructions', formData.instructions);
        if (formData.writerId) submitData.append('writerId', formData.writerId);
        
        // Append files
        selectedFiles.forEach((file) => {
          submitData.append('files', file);
        });

        await api.post('/orders', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Order created successfully');
        setShowCreateModal(false);
        setSelectedFiles([]);
      }
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error saving order:', error);
      toast.error(error.response?.data?.message || 'Failed to save order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in-progress';
      case 'pending':
        return 'pending';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || order.status === statusFilter;
    
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
    <div className="orders-page">
      {/* Header */}
      <div className="page-header">
        <button className="create-btn" onClick={handleCreateOrder}>
          <Plus />
          Create Order
        </button>
      </div>

      {/* Stats Summary */}
      <div className="orders-stats">
        <div className="stat-item">
          <span className="stat-value">{orders.length}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{orders.filter(o => o.status === 'pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{orders.filter(o => o.status === 'in_progress').length}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{orders.filter(o => o.status === 'completed').length}</span>
          <span className="stat-label">Completed</span>
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
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-card">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Writer</th>
              <th>Deadline</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="order-info">
                      <div className="order-icon">
                        <FileText />
                      </div>
                      <div className="order-details">
                        <h4>{order.subject || order.title || 'Untitled'}</h4>
                        <p>{order.pages || 0} pages</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {order.writer ? (
                      <div className="writer-info">
                        <User />
                        <span>{order.writer.user?.firstName} {order.writer.user?.lastName}</span>
                      </div>
                    ) : (
                      <span className="unassigned">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div className="deadline-info">
                      <Clock />
                      <span>{new Date(order.deadline).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="amount-info">
                      <DollarSign />
                      <span>{formatUSD(order.totalAmount || (order.pages || 0) * (order.cpp || 0))}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view" 
                        title="View"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye />
                      </button>
                      <button 
                        className="action-btn edit" 
                        title="Edit"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit />
                      </button>
                      <button 
                        className="action-btn delete" 
                        title="Delete"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
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
                <span className="detail-value">{selectedOrder.subject || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Writer</span>
                <span className="detail-value">
                  {selectedOrder.writer 
                    ? `${selectedOrder.writer.user?.firstName} ${selectedOrder.writer.user?.lastName}`
                    : 'Unassigned'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pages</span>
                <span className="detail-value">{selectedOrder.pages || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Rate (CPP)</span>
                <span className="detail-value">{formatUSD(selectedOrder.cpp || 0)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Amount</span>
                <span className="detail-value highlight">
                  {formatUSD(selectedOrder.totalAmount || (selectedOrder.pages || 0) * (selectedOrder.cpp || 0))}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Deadline</span>
                <span className="detail-value">
                  {new Date(selectedOrder.deadline).toLocaleString()}
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
                  handleEditOrder(selectedOrder);
                }}
              >
                <Edit />
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Order Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Order' : 'Create New Order'}</h2>
              <button className="close-btn" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveOrder}>
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  placeholder="e.g., Research Paper on Climate Change"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pages *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CPP ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.cpp}
                    onChange={(e) => setFormData({ ...formData, cpp: parseFloat(e.target.value) || 3.00 })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Deadline *</label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign Writer</label>
                  <select
                    value={formData.writerId}
                    onChange={(e) => setFormData({ ...formData, writerId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {writers.map((writer) => (
                      <option key={writer.id} value={writer.id}>
                        {writer.user?.firstName} {writer.user?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  placeholder="Enter order instructions..."
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>
              {!showEditModal && (
                <div className="form-group">
                  <label>Attachments</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={18} />
                      Add Files
                    </button>
                    {selectedFiles.length > 0 && (
                      <div className="selected-files">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="file-item">
                            <File size={14} />
                            <span className="file-name">{file.name}</span>
                            <button
                              type="button"
                              className="remove-file-btn"
                              onClick={() => removeFile(index)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="total-preview">
                <span>Total Amount:</span>
                <strong>{formatUSD(formData.pages * formData.cpp)}</strong>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Save />
                  {submitting ? 'Saving...' : (showEditModal ? 'Update Order' : 'Create Order')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
