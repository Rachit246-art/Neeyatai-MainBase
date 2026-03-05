import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, UserPlus, AlertCircle, CheckCircle2, PhoneCall, Phone, Shield, Building, Globe } from 'lucide-react';
import { MuiTelInput } from 'mui-tel-input';
import Select from 'react-select';
import axios from 'axios';
import { MailCheck } from 'lucide-react';



const SignupPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    control,
    getValues,
    trigger,
    reset,        // ✅ add this
    setError      // ✅ and this
  } = useForm();



  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);


  const requiredFields = ['fullName', 'email', 'password', 'confirmPassword', 'phone', 'country', 'organizationName', 'organizationType'];
  const watchedFields = watch(requiredFields);
  useEffect(() => {
    const filledFields = watchedFields.filter((val) => val && val.trim() !== '');
    const newProgress = Math.round((filledFields.length / requiredFields.length) * 100);
    setProgress(newProgress);
  }, [watchedFields]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'password' && getValues('confirmPassword')) {
        trigger('confirmPassword');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, trigger]);

  const calculateStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    return score;
  };

  const password = watch('password') || '';

  useEffect(() => {
    if (typeof password === 'string') {
      setPasswordStrength(calculateStrength(password));
    } else {
      setPasswordStrength(0);
    }
  }, [password]);



  const countryList = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
    "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
    "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
    "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad",
    "Chile", "China", "Colombia", "Comoros", "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Croatia",
    "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
    "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
    "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
    "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
    "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
    "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
    "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
    "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
    "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
    "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
    "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia",
    "Zimbabwe"
  ];
  const options = countryList.map((country) => ({
    label: country,
    value: country,
  }));

  const onSubmit = async (data) => {
    setLoading(true);
    setStatus(null);

    try {
      const { confirmPassword, ...submitData } = data;


      const response = await axios.post(`${import.meta.env.VITE_APP_API_BASE_URL}/signup`, submitData);

      if (response.status === 200 || response.status === 201) {

        reset();
        setStatus({
          type: 'success',
          message: response.data?.message || 'Account created successfully! Please check your email to verify your account.',
        });


        setShowModal(true);
      } else {
        throw new Error("Unexpected response status");
      }

    } catch (error) {
      if (error.response && error.response.data) {
        const { field, message, error: generalError } = error.response.data;

        if (field && message) {
          const frontendField = field === 'mobile' ? 'phone' : field;
          setError(frontendField, {
            type: 'manual',
            message,
          });
        } else {
          setStatus({
            type: 'error',
            message: message || generalError || 'Signup failed. Try again later.',
          });
        }
      } else {
        setStatus({
          type: 'error',
          message: 'Network error. Please check your internet connection and try again.',
        });
      }
    }

    setLoading(false);
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
            <h1 className="signup-title">Kickload</h1>
            <p className="signup-subtitle">Join us and start your journey</p>
          </div>

          {status?.message && (
            <div className={`auth-status ${status.type}`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {status.message}
            </div>
          )}

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-section">
              <h2 className="form-section-title"><User size={20} /> Personal Information</h2>
              <p className="form-section-subtitle">Tell us about yourself</p>

              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-group">
                  <input
                    id="fullName"
                    placeholder="Enter your full name"
                    disabled={loading}
                    className={`form-input has-left-icon ${errors.fullName ? 'invalid' : ''}`}
                    {...register('fullName', { required: 'Full name is required' })}
                  />
                  <User className="input-icon" size={18} />
                </div>
                {errors.fullName?.message && (
                  <div className="text-error">
                    <AlertCircle size={14} /> {errors.fullName.message}
                  </div>
                )}

              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <div style={{ position: "relative" }}>
                  <Globe className="input-icon" size={18} style={{
                    position: 'absolute',
                    top: '25px',
                    left: '16px',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    zIndex: 3,
                  }} />
                  <Controller
                    name="country"
                    control={control}
                    rules={{ required: 'Country is required' }}
                    render={({ field, fieldState }) => (
                      <Select
                        {...field}
                        inputId="country"
                        options={options}
                        isDisabled={loading}
                        placeholder="Select your country"
                        onChange={(selected) => field.onChange(selected?.value)}
                        value={options.find((opt) => opt.value === field.value) || null}
                        className={`react-select-container ${fieldState.invalid ? 'invalid' : ''}`}
                        classNamePrefix="react-select"

                        styles={{
                          control: (base, state) => ({
                            ...base,
                            paddingLeft: '2rem',
                            minHeight: '48px',
                            fontWeight: '400',
                            borderRadius: '10px',
                            backgroundColor: 'var(--card-bg)',
                            borderColor: fieldState.invalid
                              ? 'var(--error)'
                              : 'var(--border-color)',
                            boxShadow: fieldState.invalid
                              ? '0 0 0 0 var(--error)'
                              : state.isFocused
                                ? '0 0 4px var(--focus-border)'
                                : '0 0 3px rgba(30, 30, 47, 0.08)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: fieldState.invalid ? 'var(--error)' : 'var(--text-secondary)',
                            },
                            color: 'var(--text-primary)',
                          }),
                          input: (base) => ({
                            ...base,
                            color: 'var(--text-primary)', // typed text white
                            fontWeight: '400',
                            fontSize: '1rem',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            paddingLeft: '0.75rem',
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: 'var(--text-placeholder)',
                            fontWeight: '400',
                            fontSize: '1.1rem',
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: 'var(--text-primary)',
                            fontWeight: '400',
                            fontSize: '1rem',
                          }),
                          dropdownIndicator: (base) => ({
                            ...base,
                            color: 'var(--text-primary)',
                            paddingRight: '0.75rem',
                          }),
                          option: (base, { isFocused, isSelected }) => ({
                            ...base,
                            backgroundColor: isSelected
                              ? 'var(--focus-border)' // bright cyan
                              : isFocused
                                ? 'rgba(0, 198, 255, 0.1)'
                                : '#1a1a2e', // solid dark background for options
                            color: isSelected ? 'white' : 'var(--text-primary)',
                            fontWeight: isSelected ? '500' : '400',
                            fontSize: '1rem',
                            cursor: 'pointer',
                          }),
                          indicatorSeparator: () => ({
                            display: 'none',
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 20,
                            backgroundColor: '#1a1a2e', // solid dark background
                            color: 'var(--text-primary)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                          }),
                        }}

                      />
                    )}
                  />
                </div>
                {errors.country?.message && (
                  <div className="text-error">
                    <AlertCircle size={14} /> {errors.country.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-group">
                  <input
                    id="email"
                    placeholder="Enter your email"
                    disabled={loading}
                    className={`form-input has-left-icon ${errors.email ? 'invalid' : ''}`}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                        message: 'Invalid email format',
                      },
                    })}
                  />
                  <Mail className="input-icon" size={18} />
                </div>
                {errors.email?.message && (
                  <div className="text-error">
                    <AlertCircle size={14} /> {errors.email.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ required: 'Phone number is required' }}
                  render={({ field, fieldState }) => (
                    <MuiTelInput
                      {...field}
                      defaultCountry="IN"
                      forceCallingCode
                      fullWidth
                      disabled={loading}
                      error={!!fieldState.error}
                      focusOnSelectCountry
                      placeholder="Enter your phone number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          backgroundColor: 'var(--card-bg)',
                          paddingLeft: '1.2rem',
                          height: '48px',
                          fontSize: '1rem',
                          fontWeight: 400,
                          color: 'var(--text-primary)',
                          border: `1px solid ${fieldState.error ? 'var(--error)' : 'var(--border-color)'}`,
                          boxShadow: fieldState.error
                            ? '0 0 0 0 var(--error)'
                            : '0 0 3px rgba(30, 30, 47, 0.07)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: fieldState.error ? 'var(--error)' : 'var(--text-secondary)',
                          },
                          '&.Mui-focused': {
                            border: `1px solid ${fieldState.error ? 'var(--error)' : 'var(--focus-border)'}`,
                            boxShadow: fieldState.error
                              ? '0 0 0 0 var(--error)'
                              : '0 0 4px var(--focus-border)',
                          },
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '& input': {
                          fontSize: '1rem',
                          fontWeight: 400,
                          color: 'var(--text-primary)',
                          paddingLeft: '0.5rem',
                          '&::placeholder': {
                            fontWeight: 400,
                            fontSize: '1rem',
                            color: 'var(--text-placeholder)',
                          },
                        },
                        // This targets the +91 text inside the input
                        '& .MuiTypography-root': {
                          color: 'var(--text-primary) !important',
                        },
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              backgroundColor: '#1a1a2e',
                              color: 'var(--text-primary)',
                              '& .MuiMenuItem-root': {
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                fontWeight: 400,
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 198, 255, 0.1)',
                                  color: 'white',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'var(--focus-border)',
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: '#00b2e8',
                                  },
                                },
                              },
                            },
                          },
                        },
                      }}
                    />



                  )}
                />


                {errors.phone?.message && (
                  <div className="text-error">
                    <AlertCircle size={14} /> {errors.phone.message}
                  </div>
                )}
              </div>



              <div className="form-section security">
                <h2 className="form-section-title"><Shield size={20} /> Security</h2>
                <p className="form-section-subtitle">Create a strong password</p>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Enter your password"
                      disabled={loading}
                      className={`form-input has-both-icons ${errors.password ? 'invalid' : ''}`}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                        validate: (v) =>
                          (/[a-z]/.test(v) &&
                            /[A-Z]/.test(v) &&
                            /\d/.test(v) &&
                            /[^A-Za-z0-9]/.test(v)) ||
                          'Password must include uppercase, lowercase, number, and special character'
                      })}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <Lock className="input-icon" size={18} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      tabIndex="-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* ✅ Move bar OUTSIDE input-group */}
                  {password && (
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor:
                            passwordStrength < 50
                              ? '#f44336'
                              : passwordStrength < 75
                                ? '#ff9800'
                                : '#4caf50',
                        }}
                      />
                    </div>
                  )}

                  {errors.password?.message && (
                    <div className="text-error" id="password-error">
                      <AlertCircle size={14} /> {errors.password.message}
                    </div>
                  )}
                </div>



                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      disabled={loading}
                      className={`form-input has-both-icons ${errors.confirmPassword ? 'invalid' : ''}`}
                      {...register('confirmPassword', {
                        required: 'Confirm your password',
                        validate: (val) => val === getValues('password') || 'Passwords do not match'

                      })}
                    />
                    <Lock className="input-icon" size={18} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle" tabIndex="-1">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword?.message && (
                    <div className="text-error">
                      <AlertCircle size={14} /> {errors.confirmPassword.message}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="organizationName">Organization Name</label>
                  <div className="input-group">
                    <input
                      id="organizationName"
                      placeholder="Enter your organization name"
                      disabled={loading}
                      className={`form-input ${errors.organizationName ? 'invalid' : ''}`}
                      {...register('organizationName', { required: 'Organization name is required' })}
                    />
                    <Building className="input-icon" />
                  </div>
                  {errors.organizationName?.message && (
                    <div className="text-error">
                      <AlertCircle size={14} /> {errors.organizationName.message}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="organizationType">Organization Type <span style={{ color: '#a5b4fc', fontWeight: 400 }}>(optional)</span></label>
                  <div className="input-group">
                    <select
                      id="organizationType"
                      className="form-input"
                      disabled={loading}
                      {...register('organizationType')}
                    >
                      <option value="">Select organization type</option>
                      <option value="Startup">Startup</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Non-Profit">Non-Profit</option>
                      <option value="Government">Government</option>
                      <option value="Other">Other</option>
                    </select>
                    <Building className="input-icon" />
                  </div>
                </div>
              </div>
            </div>
            <div className="terms-privacy">
              <p>
                By creating an account, you agree to our{' '}
                <span className="no-link" style={{ cursor: 'default', textDecoration: 'underline', color: 'var(--primary)' }}>Terms of Service</span> and{' '}
                <a
                  href="https://neeyatai.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-link"
                  style={{ textDecoration: 'underline', color: 'var(--primary)' }}
                >
                  Privacy Policy
                </a>

              </p>
            </div>

            <button
              type="submit"
              className="custom-button"
              disabled={loading}
              style={{
                background: loading ? '#00c6ff' : '#00c6ff',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(0,198,255,0.15)',
                transition: 'background 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.background = '#33d6ff';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,198,255,0.22)';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.background = '#00c6ff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,198,255,0.15)';
                }
              }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="icon-left" />
                  <span>Create Account</span>
                </>
              )}
            </button>


          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="auth-link signup-animated-underline"
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00c6ff',
                  cursor: loading ? 'not-allowed' : 'pointer',
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
              .signup-animated-underline {
                position: relative;
                overflow: visible;
              }
              .signup-animated-underline::after {
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
              .signup-animated-underline:hover::after {
                width: 100%;
              }
              .signup-animated-underline:focus::after {
                width: 100%;
              }
            `}</style>
          </div>
        </div>
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <MailCheck className="modal-icon" />
              <h3 className="modal-heading">Email Sent!</h3>
              <p className="modal-text">Please check your inbox to verify your email address.</p>
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

export default SignupPage;
