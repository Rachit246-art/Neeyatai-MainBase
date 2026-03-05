import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, LogIn, MailCheck
} from 'lucide-react';
import '../App.css';

const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('savedEmail');
    if (rememberMe && savedEmail) {
      setValue('email', savedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setStatus({});

    try {

      const response = await axiosInstance.post("/login", {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe, // backend sets refresh token lifetime
      });

      const { user, access_token } = response.data;

      if (user && access_token) {
        if (data.rememberMe) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", access_token);
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("savedEmail", data.email);
        } else {
          sessionStorage.setItem("user", JSON.stringify(user));
          sessionStorage.setItem("token", access_token);
          localStorage.removeItem("rememberMe");
        }

        reset();
        onLoginSuccess(user); // we don’t need the token anymore
      } else {
        setStatus({ type: "error", message: "Invalid server response." });
      }
    } catch (error) {
      const res = error.response;
      if (res?.status === 403 && res?.data?.error === "Email not verified.") {
        setCurrentEmail(data.email);
        setShowVerifyModal(true);
        setStatus({ type: "error", message: "Please verify your email." });
      } else if (res?.status === 401) {
        setStatus({ type: "error", message: "Invalid email or password." });
      } else {
        setStatus({
          type: "error",
          message: res?.data?.error || "Login failed. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    setEmailSent(false);
    setStatus({});

    try {
      const res = await axiosInstance.post("/resend-verification", {
        email: currentEmail,
      });

      if (res.data.message) {
        setEmailSent(true);
      } else {
        setStatus({ type: 'error', message: 'Unexpected server response.' });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err?.response?.data?.error || 'Failed to send verification email.',
      });
    } finally {
      setResending(false);
      reset();
    }
  };
  return (
    <>
      <div className="auth-bg-animated"></div>
      <div className="auth-bg-blur"></div>
      <div className="auth-bg-particles">
        <span></span><span></span><span></span><span></span><span></span>
      </div>

      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <img src="/KickLoad.png" alt="KickLoad Logo" style={{ width: 42, height: 42, borderRadius: 50, marginBottom: 15, marginRight: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
            <h1 className="signup-title"> KickLoad</h1>
            <p className="signup-subtitle">Sign in to your account</p>
          </div>

          {status.message && (
            <div className={`auth-status ${status.type}`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-group">
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  {...register("email", { required: "Email is required" })}
                  className={`form-input has-left-icon ${errors.email ? 'invalid' : ''}`}
                  disabled={isSubmitting}
                />
                <Mail className="input-icon" size={18} />
              </div>
              {errors.email && (
                <div className="text-error"><AlertCircle size={14} /> {errors.email.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  {...register("password", { required: "Password is required" })}
                  className={`form-input has-both-icons ${errors.password ? 'invalid' : ''}`}
                  disabled={isSubmitting}
                />
                <Lock className="input-icon" size={18} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle" tabIndex="-1">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="text-error"><AlertCircle size={14} /> {errors.password.message}</div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="forgot-password forgot-link-animated-underline"
              disabled={isSubmitting}
              style={{
                background: 'none',
                border: 'none',
                color: '#00c6ff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                padding: 0,
                position: 'relative',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Forgot password?
            </button>

            <div className="remember-me-row">
              <input
                type="checkbox"
                id="rememberMe"
                {...register("rememberMe")}
                disabled={isSubmitting}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>

            <button
              type="submit"
              className="custom-button"
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? '#00c6ff' : '#00c6ff',
                color: '#fff',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(0,198,255,0.15)',
                transition: 'background 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#33d6ff';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,198,255,0.22)';
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#00c6ff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,198,255,0.15)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="auth-link login-animated-underline"
                disabled={isSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00c6ff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  padding: 0,
                  position: 'relative',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                Create account
              </button>
            </p>
            <style>{`
              .login-animated-underline {
                position: relative;
                overflow: visible;
              }
              .login-animated-underline::after {
                content: '';
                position: absolute;
                left: 0;
                bottom: -2px;
                width: 0%;
                height: 2px;
                background: #00c6ff;
                transition: width 0.3s cubic-bezier(.4,0,.2,1);
                border-radius: 2px;
              }
              .login-animated-underline:hover::after {
                width: 100%;
              }
              .login-animated-underline:focus::after {
                width: 100%;
              }
              .forgot-link-animated-underline {
                position: relative;
                overflow: visible;
              }
              .forgot-link-animated-underline::after {
                content: '';
                position: absolute;
                left: 0;
                bottom: -2px;
                width: 0%;
                height: 2px;
                background: #00c6ff;
                transition: width 0.3s cubic-bezier(.4,0,.2,1);
                border-radius: 2px;
              }
              .forgot-link-animated-underline:hover::after {
                width: 100%;
              }
              .forgot-link-animated-underline:focus::after {
                width: 100%;
              }
            `}</style>
          </div>
        </div>
      </div>

      {showVerifyModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <MailCheck className="modal-icon" />
            <h3 className="modal-heading">
              {emailSent ? 'Email Sent!' : 'Verify Your Email'}
            </h3>
            <p className="modal-text">
              {emailSent ? (
                <>Please check your inbox to verify your email address sent to <strong>{currentEmail}</strong>.</>
              ) : (
                <>Your email <strong>{currentEmail}</strong> is not verified.</>
              )}
            </p>

            {/* Only show one button depending on the state */}
            {emailSent ? (
              <button
                className="modal-ok-button"
                onClick={() => {
                  setShowVerifyModal(false);
                  setEmailSent(false);
                  setCurrentEmail('');
                }}
              >
                OK
              </button>
            ) : (
              <button
                className="modal-ok-button"
                onClick={resendVerification}
                disabled={resending}
              >
                {resending ? 'Resending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        </div>
      )}

    </>
  );
};

export default LoginPage;
