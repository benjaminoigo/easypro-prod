import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await login(data.email, data.password);
      toast.success('Login successful!');
      const redirectTo = searchParams.get('redirect') || 
        (response.user.role === 'admin' ? '/admin' : '/writer');
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel - Branding */}
      <div className="login-branding">
        <div className="branding-decoration-top"></div>
        <div className="branding-decoration-corner"></div>
        
        <div className="branding-content">
          <div className="branding-logo">
            <div className="branding-logo-icon">
              <Zap />
            </div>
            <span className="branding-logo-text">Writer<span>Street</span></span>
          </div>
          
          <div className="dashboard-preview">
            <div className="dashboard-preview-header">
              <div className="dashboard-preview-dot red"></div>
              <div className="dashboard-preview-dot yellow"></div>
              <div className="dashboard-preview-dot green"></div>
            </div>
            <div className="dashboard-preview-content">
              <div className="dashboard-preview-sidebar">
                <div className="preview-nav-item active"></div>
                <div className="preview-nav-item"></div>
                <div className="preview-nav-item"></div>
                <div className="preview-nav-item"></div>
              </div>
              <div className="dashboard-preview-main">
                <div className="preview-stat-row">
                  <div className="preview-stat-card"></div>
                  <div className="preview-stat-card"></div>
                  <div className="preview-stat-card"></div>
                </div>
                <div className="preview-table">
                  <div className="preview-table-row"></div>
                  <div className="preview-table-row"></div>
                  <div className="preview-table-row"></div>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="branding-title">Easy to use Dashboard</h2>
          <p className="branding-subtitle">
            Manage your academic writing orders, track progress, and collaborate with writers seamlessly.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-form-section">
        <div className="login-form-container">
          <h1 className="login-form-title">Sign In to Your Account</h1>

          {error && (
            <div className="login-error-alert">
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="form-field">
              <label className="form-field-label">
                <Mail size={16} />
                Email Address
              </label>
              <div className="form-field-input-wrapper">
                <input
                  type="email"
                  autoComplete="email"
                  className={`form-field-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="Enter your email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                <Mail className="form-field-icon" />
              </div>
              {errors.email && (
                <p className="form-field-error">
                  <AlertCircle size={14} />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="form-field">
              <label className="form-field-label">
                <Lock size={16} />
                Password
              </label>
              <div className="form-field-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-field-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <Lock className="form-field-icon" />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && (
                <p className="form-field-error">
                  <AlertCircle size={14} />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="login-footer-link">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
