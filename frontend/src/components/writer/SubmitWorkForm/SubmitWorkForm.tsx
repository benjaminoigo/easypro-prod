import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, FileText, X, Send, AlertCircle } from 'lucide-react';
import './SubmitWorkForm.css';

export interface SubmitWorkFormData {
  pagesWorked: number;
  notes?: string;
  file?: File;
}

export interface SubmitWorkFormProps {
  orderId: string;
  orderTitle: string;
  orderPages: number;
  cpp: number;
  onSubmit: (data: SubmitWorkFormData) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  maxPages?: number;
  className?: string;
}

const SubmitWorkForm: React.FC<SubmitWorkFormProps> = ({
  orderId,
  orderTitle,
  orderPages,
  cpp,
  onSubmit,
  onCancel,
  isLoading = false,
  maxPages,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SubmitWorkFormData>({
    defaultValues: {
      pagesWorked: orderPages,
    },
  });

  const pagesWorked = watch('pagesWorked', orderPages);
  const estimatedEarnings = (pagesWorked || 0) * cpp;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (data: SubmitWorkFormData) => {
    await onSubmit({
      ...data,
      file: selectedFile || undefined,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <form 
      className={`submit-work-form ${className}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className="order-info">
        <h3 className="order-title">{orderTitle}</h3>
        <span className="order-id">Order #{orderId}</span>
      </div>

      <div className="form-group">
        <label htmlFor="pagesWorked">Pages Completed</label>
        <input
          id="pagesWorked"
          type="number"
          min="1"
          max={maxPages || orderPages}
          {...register('pagesWorked', {
            valueAsNumber: true,
            required: 'Pages worked is required',
            min: { value: 1, message: 'Must complete at least 1 page' },
            max: { 
              value: maxPages || orderPages, 
              message: `Cannot exceed ${maxPages || orderPages} pages` 
            },
          })}
          className={`form-input ${errors.pagesWorked ? 'error' : ''}`}
        />
        {errors.pagesWorked && (
          <span className="error-message">
            <AlertCircle />
            {errors.pagesWorked.message}
          </span>
        )}
        <span className="input-hint">
          Order requires {orderPages} pages. Rate: ${cpp.toFixed(2)}/page
        </span>
      </div>

      <div className="earnings-preview">
        <span className="earnings-label">Estimated Earnings</span>
        <span className="earnings-value">${estimatedEarnings.toFixed(2)}</span>
      </div>

      <div className="form-group">
        <label>Upload Work File (Optional)</label>
        <div
          className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".doc,.docx,.pdf,.txt,.rtf"
            hidden
          />

          {selectedFile ? (
            <div className="selected-file">
              <FileText className="file-icon" />
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{formatFileSize(selectedFile.size)}</span>
              </div>
              <button
                type="button"
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <X />
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <Upload className="upload-icon" />
              <span className="upload-text">
                Drag & drop your file here or <span className="browse-link">browse</span>
              </span>
              <span className="upload-hint">
                Supported: DOC, DOCX, PDF, TXT, RTF (Max 10MB)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (Optional)</label>
        <textarea
          id="notes"
          {...register('notes')}
          className="form-textarea"
          rows={3}
          placeholder="Any notes about your work..."
        />
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          <Send />
          {isLoading ? 'Submitting...' : 'Submit Work'}
        </button>
      </div>
    </form>
  );
};

export default SubmitWorkForm;
