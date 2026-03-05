import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaTimes } from 'react-icons/fa';
import axiosInstance from '../api/axiosInstance'; // adjust import path as needed

const EmailSettingsModal = ({ open, onClose }) => {
  const [emails, setEmails] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEmails();
      setInput('');
      setError('');
    }
  }, [open]);

  const fetchEmails = async () => {
    try {
      const res = await axiosInstance.get("/additional-emails");
      setEmails(res.data);
    } catch (err) {
      setError("Failed to load emails");
    }
  };

  const handleAdd = async () => {
    setError('');
    const email = input.trim().toLowerCase();
    if (!email) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Invalid email address');
      return;
    }
    if (emails.includes(email)) {
      setError('Email already added');
      return;
    }
    try {
      setLoading(true);
      await axiosInstance.post("/add-email", { email });
      await fetchEmails();
      setInput('');
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add email");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (email) => {
    try {
      setLoading(true);
      await axiosInstance.post("/remove-email", { email });
      await fetchEmails();
    } catch (err) {
      setError("Failed to remove email");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;


  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(20,22,34,0.55)',
      zIndex: 20000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s',
    }}>
      <style>{`
        input[type="email"]:-webkit-autofill,
        input[type="email"]:-webkit-autofill:focus,
        input[type="email"]:-webkit-autofill:hover,
        input[type="email"]:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #23243a inset !important;
          box-shadow: 0 0 0 1000px #23243a inset !important;
          -webkit-text-fill-color: #f5f5f5 !important;
          caret-color: #00c6ff !important;
          border-radius: 8px;
          transition: background-color 5000s ease-in-out 0s;
        }
        input[type="email"]::placeholder {
          color: #b0b8d1 !important;
          opacity: 1;
        }
      `}</style>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'linear-gradient(135deg,rgb(29, 30, 77) 60%,rgb(17, 18, 37) 100%)',
        borderRadius: '20px',
        color: 'var(--text-primary, #f5f5f5)',
        boxShadow: '0 8px 32px 0 rgba(0,198,255,0.18), 0 2px 8px 0 rgba(0,0,0,0.10)',
        padding: '2.2rem 2rem 2rem 2rem',
        margin: '0 1rem',
        border: '1.5px solid rgba(0,198,255,0.18)',
        position: 'relative',
        animation: 'fadeInScale 0.25s',
        backdropFilter: 'blur(6px)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            opacity: 0.7,
            zIndex: 2,
          }}
          aria-label="Close"
        >
          <FaTimes />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            background: ' #00c6ff ',
            borderRadius: '50%',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,198,255,0.10)',
          }}>
            <FaEnvelope size={20} color="#fff" />
          </div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.45rem', letterSpacing: '-0.5px' }}>Email Settings</h2>
        </div>
        {/* 👉 Concise Info Section */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 18,
          fontSize: '0.9rem',
          lineHeight: 1.45,
          color: '#d1d5db'
        }}>
          <strong>Why add emails?</strong>
          Reports are normally sent only to your account email.
          Here, you can add or remove extra addresses so teammates or clients also receive the report when you press <em>Send Email</em>.
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <input
            type="email"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add email address"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1.5px solid var(--border-color, #2a2b3d)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-primary, #f5f5f5)',
              fontSize: 16,
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              background: ' #00c6ff ',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,198,255,0.10)',
              transition: 'background 0.2s, filter 0.2s',
              letterSpacing: '0.01em',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg,rgb(0, 174, 255) 50%, #3a4fff 100%)'}
            onMouseOut={e => e.currentTarget.style.background = ' #00c6ff '}
          >
            Add
          </button>
        </div>
        {error && <div style={{ color: 'var(--error, #EF4444)', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {emails.length === 0 && <li style={{ color: '#aaa', fontSize: 15, padding: '10px 0' }}>No emails added yet.</li>}
          {emails.map(email => (
            <li key={email} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              fontSize: 15,
              gap: 10,
            }}>
              <span style={{ wordBreak: 'break-all' }}>{email}</span>
              <button
                onClick={() => handleRemove(email)}
                style={{
                  background: 'linear-gradient(90deg, #f5576c 60%, #ff6d6d 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  boxShadow: '0 1px 4px rgba(245,87,108,0.10)',
                  transition: 'background 0.2s, filter 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #ff6d6d 60%, #f5576c 100%)'}
                onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #f5576c 60%, #ff6d6d 100%)'}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EmailSettingsModal; 
