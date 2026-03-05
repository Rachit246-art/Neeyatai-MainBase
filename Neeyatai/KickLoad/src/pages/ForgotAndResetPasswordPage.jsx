import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import '../App.css';


const ForgotAndResetPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1.email -> 2.OTP -> 3.Reset Password
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false); 

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm();

  // Submit email
  const onSubmitEmail = async (data) => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      await axios.post(`${import.meta.env.VITE_APP_API_BASE_URL}/request-reset`, { email: data.email });
      setEmail(data.email);
      setValue("email", data.email);
      setStep(2);
      setStatus({ type: 'success', message: 'OTP sent to your email.' });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send OTP.';
      setStatus({ type: 'error', message });
    }
    setIsSubmitting(false);
  };

  // Submit OTP
  const onSubmitOTP = async (data) => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      const payload = { email: email, otp: data.otp };
      await axios.post(`${import.meta.env.VITE_APP_API_BASE_URL}/verify-otp`, payload);
      setValue("otp", data.otp);
      setStep(3);
      setStatus({ type: 'success', message: 'OTP verified. You can now reset your password.' });
    } catch (error) {
      const err = error.response?.data?.error || 'Invalid or expired OTP.';
      setStatus({ type: 'error', message: err });

      // Reset to step 1 on invalid/expired OTP
      if (err.toLowerCase().includes('invalid') || err.toLowerCase().includes('expired')) {
        setTimeout(() => {
          setStep(1);
          setStatus(null);
          setEmail('');
          setValue('otp', '');
          setValue('email', '');
        }, 1500);
      }
    }
    setIsSubmitting(false);
  };


  // Submit new password
  const onSubmitPassword = async (data) => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      const payload = {
        email: email,
        otp: getValues("otp"),
        password: data.password
      };
      await axios.post(`${import.meta.env.VITE_APP_API_BASE_URL}/reset-password-with-otp`, payload);
      setShowModal(true);
    } catch (error) {
      const err = error.response?.data?.error || 'Something went wrong.';
      setStatus({ type: 'error', message: err });

      // Reset to step 1 if OTP is invalid/expired
      if (err.toLowerCase().includes('invalid') || err.toLowerCase().includes('expired')) {
        setTimeout(() => {
          setStep(1);
          setStatus(null);
          setEmail('');
          setValue('otp', '');
          setValue('email', '');
          setValue('password', '');
        }, 1500);
      }
    }
    setIsSubmitting(false);
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
            <div className="signup-icon">
              <Mail size={24} />
            </div>
            <h1 className="signup-title">Forgot Password</h1>
            <p className="signup-subtitle">Follow steps to reset your password</p>
          </div>

          {status?.message && (
            <div className={`auth-status ${status.type}`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {status.message}
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
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
                {errors.email && <div className="text-error"><AlertCircle size={14} /> {errors.email.message}</div>}
              </div>

              <button type="submit" className="reset-password-button" disabled={isSubmitting}
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
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Sending...</span>
                  </>
                ) : 'Send OTP'}
              </button>

            </form>
          )}

          {/* Step 2: OTP Form */}
          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmitOTP)} className="space-y-4">
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <div className="input-group">
                  <input
                    type="text"
                    id="otp"
                    placeholder="Enter OTP"
                    {...register("otp", { required: "OTP is required" })}
                    className={`form-input ${errors.otp ? 'invalid' : ''}`}
                    disabled={isSubmitting}
                  />
                  <KeyRound className="input-icon" size={18} />
                </div>
                {errors.otp && <div className="text-error"><AlertCircle size={14} /> {errors.otp.message}</div>}
              </div>

              <button type="submit" className="reset-password-button" disabled={isSubmitting}
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
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Verifying...</span>
                  </>
                ) : 'Verify OTP'}
              </button>


            </form>
          )}

          {/* Step 3: Reset Password Form */}
          {step === 3 && (
            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter new password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                      validate: (v) =>
                        (/[a-z]/.test(v) &&
                          /[A-Z]/.test(v) &&
                          /\d/.test(v) &&
                          /[^A-Za-z0-9]/.test(v)) ||
                        "Password must include uppercase, lowercase, number, and special character"
                    })}
                    className={`form-input has-left-icon has-right-icon ${errors.password ? 'invalid' : ''}`}
                    disabled={isSubmitting}
                  />

                  {/* Left icon: Lock */}
                  <Lock className="input-icon" size={18} />

                  {/* Right icon: Eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-icon-right"
                    tabIndex="-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password && (
                  <div className="text-error">
                    <AlertCircle size={14} /> {errors.password.message}
                  </div>
                )}
              </div>


              <button type="submit" className="reset-password-button" disabled={isSubmitting}
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
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Resetting...</span>
                  </>
                ) : 'Reset Password'}
              </button>

            </form>
          )}

          <div className="auth-footer">
            <p>Remember your password?{' '}
              <button
                onClick={() => navigate('/login')}
                className="auth-link forgot-animated-underline"
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
                Sign in
              </button>
            </p>
            <style>{`
              .forgot-animated-underline {
                position: relative;
                overflow: visible;
              }
              .forgot-animated-underline::after {
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
              .forgot-animated-underline:hover::after {
                width: 100%;
              }
              .forgot-animated-underline:focus::after {
                width: 100%;
              }
            `}</style>
          </div>
        </div>
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <CheckCircle2 className="modal-icon" />
              <h3 className="modal-heading">Password Reset!</h3>
              <p className="modal-text">Your password has been reset successfully. You can now sign in.</p>
              <button
                className="modal-ok-button"
                onClick={() => {
                  setShowModal(false);
                  navigate('/login');
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default ForgotAndResetPasswordPage;