import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building, Globe, CreditCard, Edit2,
  CheckCircle2, AlertCircle, CalendarCheck, Clock, BadgeCheck,
  Shield, Crown, Settings, Trash2
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import ReactDOM from "react-dom";

const getUser = () => {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user?.mobile || '');
  const [phoneStatus, setPhoneStatus] = useState(null);
  const [cardStatus, setCardStatus] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardRef = useRef();
  const [cardDetails, setCardDetails] = useState({
    last4: user?.card_last4 || null,
    network: user?.card_network || null,
    verified: user?.card_verified || false,
  });

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setPhone(u?.mobile || '');
    setCardDetails({
      last4: u?.card_last4 || null,
      network: u?.card_network || null,
      verified: u?.card_verified || false,
    });
  }, []);
  const validPhoneRegex = /^\+?[0-9\s\-().]{6,20}$/;

  const handlePhoneSave = async () => {
    if (!validPhoneRegex.test(phone)) {
      setPhoneStatus({ type: 'error', message: 'Enter a valid phone number.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post('/update-mobile', { mobile: phone }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = { ...user, mobile: phone };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setPhoneStatus({ type: 'success', message: 'Phone updated successfully.' });
      setEditingPhone(false);  // only set editing to false on success
    } catch {
      setPhoneStatus({ type: 'error', message: 'Failed to update phone.' });
      // do not set editing to false so user can retry
    }
  };


  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post('/delete-account', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      sessionStorage.clear();
      navigate('/signup');
    } catch {
      alert('Failed to delete account.');
    }
  };

  const handleAddCard = async () => {
    try {
      const token = localStorage.getItem('token');
      const orderRes = await axiosInstance.post('/payments/create-order', { months: 1 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { id: order_id } = orderRes.data;
      const rzp = new window.Razorpay({
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: 100,
        currency: 'INR',
        order_id,
        name: 'KickLoad',
        description: 'Card verification',
        handler: async function (response) {
          const verifyRes = await axiosInstance.post('/payments/verify-and-save-card', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const updatedUser = {
            ...user,
            card_verified: verifyRes.data.card_verified,
            card_last4: verifyRes.data.card_last4,
            card_network: verifyRes.data.card_network
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCardDetails({
            verified: true,
            last4: verifyRes.data.card_last4,
            network: verifyRes.data.card_network
          });
          setCardStatus({ type: 'success', message: 'Card verified and saved.' });
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#FF6D00'
        }
      });
      rzp.open();
    } catch {
      setCardStatus({ type: 'error', message: 'Failed to verify card.' });
    }
  };

  useEffect(() => {
    document.body.style.overflow = showDeleteConfirm ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showDeleteConfirm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setPhoneStatus(null);
        setCardStatus(null);
        if (editingPhone) {
          setPhone(user?.mobile || '');
          setEditingPhone(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingPhone, user]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px 20px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div
        ref={cardRef}
        style={{
          width: '100%',
          maxWidth: 700,
          margin: '48px auto 0 auto', // Add marginTop to create space below header
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.1)',
          padding: '48px 32px 40px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'linear-gradient(45deg, rgba(255,109,0,0.1), rgba(255,109,0,0.05))',
          borderRadius: '50%',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.05))',
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6D00, #FF8A00)',
              marginBottom: 20,
              boxShadow: '0 8px 32px rgba(255,109,0,0.3)',
              position: 'relative'
            }}>
              <User size={32} style={{ color: '#fff' }} />
              <div style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #fff'
              }}>
                <CheckCircle2 size={12} style={{ color: '#fff' }} />
              </div>
            </div>
            <h1 style={{
              color: '#1F2937',
              fontWeight: 800,
              fontSize: 32,
              marginBottom: 8,
              letterSpacing: -0.5
            }}>
              {user?.name}
            </h1>
            <p style={{
              color: '#6B7280',
              fontSize: 16,
              margin: 0,
              fontWeight: 500
            }}>
              {user?.email}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Personal Info Section */}
            <SectionCard title="Personal Information" icon={<User />}>
              <InfoRow icon={<User />} label="Full Name" value={user?.name} />
              <InfoRow icon={<Mail />} label="Email Address" value={user?.email} />
              <InfoRow
                icon={<Phone />}
                label="Phone Number"
                value={phone}
                originalValue={user?.mobile}
                editable
                editing={editingPhone}
                setEditing={setEditingPhone}
                onSave={handlePhoneSave}
                onChange={setPhone}
              />
              {phoneStatus && <StatusMessage status={phoneStatus} />}
              <InfoRow icon={<Globe />} label="Country" value={user?.country} />
              <InfoRow icon={<Building />} label="Organization" value={user?.organization} />
            </SectionCard>

            {/* Card Status Section */}
            <SectionCard title="Payment Method" icon={<CreditCard />}>
              <CardStatusRow
                icon={<CreditCard />}
                verified={cardDetails.verified}
                network={cardDetails.network}
                last4={cardDetails.last4}
                cardStatus={cardStatus}
                onButtonClick={handleAddCard}
              />
              {cardStatus && <StatusMessage status={cardStatus} />}
            </SectionCard>

            {/* License Info Section */}
            <SectionCard title="Subscription Details" icon={<Crown />}>
              <InfoRow icon={<BadgeCheck />} label="License Type" value={user?.license} />
              <InfoRow icon={<Clock />} label="Trial Ends" value={new Date(user?.trial_ends_at).toLocaleDateString()} />
              <InfoRow icon={<CalendarCheck />} label="Paid Until" value={new Date(user?.paid_ends_at).toLocaleDateString()} />
            </SectionCard>

            {/* Account Actions */}
            <SectionCard title="Account Actions" icon={<Settings />}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                background: 'linear-gradient(135deg, #FEF3F2, #FEE4E2)',
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(239,68,68,0.1)',
                  }}>
                    <Shield size={20} style={{ color: '#EF4444' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#1F2937', fontWeight: 600, fontSize: 16 }}>
                      Danger Zone
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: 14 }}>
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="!self-center !bg-gradient-to-r !from-red-500 !to-red-600 !text-white !px-5 !py-3 !rounded-xl !font-semibold !text-sm !shadow-md !hover:shadow-lg !hover:-translate-y-0.5 !transition-all !flex !items-center !justify-center !gap-2"
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>

              </div>
            </SectionCard>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: 32,
                borderRadius: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxWidth: 400,
                width: '90%',
                textAlign: 'center',
                animation: 'slideUp 0.3s ease',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)',
                margin: '0 auto 20px auto'
              }}>
                <AlertCircle size={28} style={{ color: '#EF4444' }} />
              </div>
              <h3 style={{
                margin: '0 0 12px 0',
                color: '#1F2937',
                fontWeight: 700,
                fontSize: 20
              }}>
                Delete Account
              </h3>
              <p style={{
                margin: '0 0 24px 0',
                color: '#6B7280',
                fontSize: 16,
                lineHeight: 1.5
              }}>
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: 100
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#E5E7EB';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#F3F4F6';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: 100,
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @media (max-width: 768px) {
          .profile-card { 
            padding: 32px 20px 32px 20px !important; 
            margin: 10px !important;
          }
        }
        
        @media (max-width: 480px) {
          .profile-card { 
            padding: 24px 16px 24px 16px !important; 
          }
        }
      `}</style>
    </div>
  );
};

const SectionCard = ({ title, icon, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.3)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease'
  }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: '1px solid rgba(0,0,0,0.08)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255,109,0,0.1), rgba(255,109,0,0.05))',
      }}>
        {React.cloneElement(icon, { size: 20, style: { color: '#FF6D00' } })}
      </div>
      <h3 style={{
        margin: 0,
        color: '#1F2937',
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: -0.3
      }}>
        {title}
      </h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {children}
    </div>
  </div>
);

const InfoRow = ({ icon, label, value, originalValue,
  editable, editing, setEditing,
  onSave, onChange, buttonText, onButtonClick }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 48,
    padding: '8px 0',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(255,109,0,0.08)',
      }}>
        {React.cloneElement(icon, { size: 18, style: { color: '#FF6D00' } })}
      </div>
      <span style={{
        color: '#6B7280',
        fontWeight: 500,
        fontSize: 14,
        minWidth: 100
      }}>
        {label}
      </span>
    </div>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
      flex: 1,
      justifyContent: 'flex-end'
    }}>
      {editable ? (
        editing ? (
          <>
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              style={{
                fontFamily: 'inherit',
                fontSize: 15,
                border: '2px solid #E5E7EB',
                borderRadius: 12,
                padding: '8px 16px',
                background: '#F9FAFB',
                color: '#1F2937',
                minWidth: 140,
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#FF6D00';
                e.target.style.background = '#FFF8F1';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.background = '#F9FAFB';
              }}
              autoFocus
            />
            <button
              onMouseDown={e => { e.preventDefault(); onSave(); }}
              style={{
                color: '#10B981',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <CheckCircle2 size={18} />
            </button>
          </>
        ) : (
          <>
            <span style={{
              color: '#1F2937',
              fontWeight: 600,
              fontSize: 15,
              minWidth: 120,
              textAlign: 'right'
            }}>
              {value || '-'}
            </span>
            <button
              onClick={() => setEditing(true)}
              style={{
                color: '#FF6D00',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,109,0,0.1)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,109,0,0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,109,0,0.1)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Edit2 size={16} />
            </button>
          </>
        )
      ) : buttonText && onButtonClick ? null : (
        <span style={{
          color: '#1F2937',
          fontWeight: 600,
          fontSize: 15,
          minWidth: 120,
          textAlign: 'right'
        }}>
          {label === 'Password' ? '••••••••' : value || '-'}
        </span>
      )}
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          style={{
            background: 'linear-gradient(135deg, #FF6D00, #FF8A00)',
            color: '#fff',
            borderRadius: 12,
            border: 'none',
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(255,109,0,0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,109,0,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,109,0,0.3)';
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  </div>
);

const CardStatusRow = ({ icon, verified, network, last4, cardStatus, onButtonClick }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 48,
    padding: '8px 0'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(255,109,0,0.08)',
      }}>
        {React.cloneElement(icon, { size: 18, style: { color: '#FF6D00' } })}
      </div>
      <span style={{
        color: '#6B7280',
        fontWeight: 500,
        fontSize: 14,
        minWidth: 100
      }}>
        Payment Method
      </span>
    </div>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
      flex: 1,
      justifyContent: 'flex-end'
    }}>
      {verified ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          background: 'rgba(16,185,129,0.1)',
          borderRadius: 12,
          border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          <span style={{
            color: '#1F2937',
            fontWeight: 600,
            fontSize: 15
          }}>
            {network} •••• {last4}
          </span>
        </div>
      ) : (
        <>
          <span style={{
            color: '#6B7280',
            fontWeight: 500,
            fontSize: 15,
            minWidth: 120,
            textAlign: 'right'
          }}>
            Not Verified
          </span>
          <button
            onClick={onButtonClick}
            style={{
              background: 'linear-gradient(135deg, #FF6D00, #FF8A00)',
              color: '#fff',
              borderRadius: 12,
              border: 'none',
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255,109,0,0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,109,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,109,0,0.3)';
            }}
          >
            Verify Card
          </button>
        </>
      )}
    </div>
  </div>
);

const StatusMessage = ({ status }) => (
  <div style={{
    color: status.type === 'success' ? '#10B981' : '#EF4444',
    fontWeight: 500,
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontStyle: status.type === 'error' ? 'italic' : 'normal',
    fontSize: 14,
    padding: '8px 12px',
    background: status.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
  }}>
    {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
    {status.message}
  </div>
);

export default ProfilePage; 
