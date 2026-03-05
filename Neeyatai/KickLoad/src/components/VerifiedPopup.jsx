import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Info, XCircle, AlertTriangle } from 'lucide-react';
 
const VerifiedPopup = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState(null);
  const [showLoginButton, setShowLoginButton] = useState(false);
 
  useEffect(() => {
    switch (status) {
      case 'success':
        setMessage('Your email has been successfully verified!');
        setIcon(<CheckCircle2 size={48} color="#28a745" />);
        setShowLoginButton(true);
        break;
      case 'already_verified':
        setMessage('Email already verified. You can log in.');
        setIcon(<Info size={48} color="#007bff" />);
        setShowLoginButton(true);
        break;
      case 'not_found':
        setMessage('User not found.');
        setIcon(<XCircle size={48} color="#dc3545" />);
        setShowLoginButton(false);
        break;
      case 'error':
      default:
        setMessage('Invalid or expired verification link.');
        setIcon(<AlertTriangle size={48} color="#ffc107" />);
        setShowLoginButton(false);
        break;
    }
  }, [status]);
 
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#fff8f1",
      padding: "16px"
    }}>
      <div style={{
        background: "#fff",
        padding: "32px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        textAlign: "center",
        maxWidth: "420px",
        width: "100%"
      }}>
        <div style={{ marginBottom: "20px" }}>{icon}</div>
        <h2 style={{
          fontSize: "22px",
          marginBottom: "12px",
          color: "#333"
        }}>
          Email Verification
        </h2>
        <p style={{
          fontSize: "16px",
          color: "#555",
          marginBottom: showLoginButton ? "20px" : "0"
        }}>
          {message}
        </p>
        {showLoginButton && (
          <button
            onClick={() => navigate("/login")}
            style={{
              backgroundColor: "#FF6D00",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
};
 
export default VerifiedPopup;