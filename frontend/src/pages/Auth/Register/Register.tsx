import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  Eye, EyeOff, Mail, Lock, User, UserPlus, AlertCircle, 
  Zap, Shield, Clock, FileText, CheckCircle 
} from 'lucide-react';
import authService from '../../../services/auth.service';
import './Register.css';

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inviteToken = searchParams.get('invite');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await authService.register(registerData, inviteToken || undefined);
      
      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Left Panel - Branding */}
      <div className="register-branding">
        <div className="register-decoration-top"></div>
        <div className="register-decoration-corner"></div>
        
        <div className="register-branding-content">
          <div className="register-branding-logo">
            <div className="register-logo-icon">
              <Zap />
            </div>
            <span className="register-logo-text">Easy<span>Pro</span></span>
          </div>
          
          <div className="register-features">
            <div className="register-feature">
              <div className="register-feature-icon">
                <FileText />
              </div>
              <div className="register-feature-text">
                <h4>Order Management</h4>
                <p>Track and manage all writing orders efficiently</p>
              </div>
            </div>
            
            <div className="register-feature">
              <div className="register-feature-icon">
                <Clock />
              </div>
              <div className="register-feature-text">
                <h4>24/7 Shift System</h4>
                <p>Automated shift management for writers</p>
              </div>
            </div>
            
            <div className="register-feature">
              <div className="register-feature-icon">
                <Shield />
              </div>
              <div className="register-feature-text">
                <h4>Secure Platform</h4>
                <p>Role-based access with secure authentication</p>
              </div>
            </div>
          </div>
          
          <h2 className="register-branding-title">Join Our Team</h2>
          <p className="register-branding-subtitle">
            Start your journey as an academic writer today and earn on your own schedule.
          </p>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="register-form-section">
        <div className="register-form-container">
          <h1 className="register-form-title">Create Your Account</h1>
          <p className="register-form-subtitle">
            Fill in your details to get started
          </p>

          {inviteToken && (
            <div className="register-invite-notice">
              <CheckCircle />
              <span>You're registering with an invitation. Your account will be prioritized.</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="register-form">
            <div className="register-form-row">
              <div className="register-form-field">
                <label className="register-field-label">
                  <User size={16} />
                  First Name
                </label>
                <div className="register-field-wrapper">
                  <input
                    type="text"
                    autoComplete="given-name"
                    className={`register-field-input ${errors.firstName ? 'has-error' : ''}`}
                    placeholder="Your Name"
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'Min 2 characters',
                      },
                    })}
                  />
                  <User className="register-field-icon" />
                </div>
                {errors.firstName && (
                  <p className="register-field-error">
                    <AlertCircle size={14} />
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="register-form-field">
                <label className="register-field-label">
                  <User size={16} />
                  Last Name
                </label>
                <div className="register-field-wrapper">
                  <input
                    type="text"
                    autoComplete="family-name"
                    className={`register-field-input ${errors.lastName ? 'has-error' : ''}`}
                    placeholder="Your Name"
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Min 2 characters',
                      },
                    })}
                  />
                  <User className="register-field-icon" />
                </div>
                {errors.lastName && (
                  <p className="register-field-error">
                    <AlertCircle size={14} />
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="register-form-field">
              <label className="register-field-label">
                <Mail size={16} />
                Your Email
              </label>
              <div className="register-field-wrapper">
                <input
                  type="email"
                  autoComplete="email"
                  className={`register-field-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="Enter your email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                <Mail className="register-field-icon" />
              </div>
              {errors.email && (
                <p className="register-field-error">
                  <AlertCircle size={14} />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="register-form-field">
              <label className="register-field-label">
                <Lock size={16} />
                Password
              </label>
              <div className="register-field-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`register-field-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="Create a password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Must be 6 characters at least',
                    },
                  })}
                />
                <Lock className="register-field-icon" />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password ? (
                <p className="register-field-error">
                  <AlertCircle size={14} />
                  {errors.password.message}
                </p>
              ) : (
                <p className="register-field-hint">Must be 6 characters at least</p>
              )}
            </div>

            <div className="register-form-field">
              <label className="register-field-label">
                <Lock size={16} />
                Confirm Password
              </label>
              <div className="register-field-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`register-field-input ${errors.confirmPassword ? 'has-error' : ''}`}
                  placeholder="Confirm your password"
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                />
                <Lock className="register-field-icon" />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="register-field-error">
                  <AlertCircle size={14} />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="register-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="register-btn-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Register
                  <UserPlus size={18} />
                </>
              )}
            </button>
          </form>

          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="register-footer-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
