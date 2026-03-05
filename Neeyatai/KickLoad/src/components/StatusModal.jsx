import React from 'react';
import ReactDOM from 'react-dom';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

const typeConfig = {
  success: {
    color: '#6366F1', // Indigo blue
    icon: <FaCheckCircle size={28} />, // Larger icon
    title: 'Success',
    borderColor: '#4F46E5',
    buttonColor: '#4F46E5',
    buttonHover: '#3730A3',
    backgroundColor: '#EEF2FF',
    textColor: '#312E81', // Dark indigo text
    modalBackground: '#EEF2FF',
    shadowColor: '#6366F1',
    gradientStart: '#EEF2FF',
    gradientEnd: '#C7D2FE',
    overlayColor: 'rgba(20,22,34,0.75)' // Darker overlay
  },
  error: {
    color: '#E14434',
    icon: <FaTimesCircle size={24} />,
    title: 'Error',
    borderColor: '#E14434',
    buttonColor: '#E14434',
    buttonHover: '#d63031'
  },
  info: {
    color: '#FF7A00',
    icon: <FaInfoCircle size={24} />,
    title: 'Notice',
    borderColor: '#FF7A00',
    buttonColor: '#FF7A00',
    buttonHover: '#e06600'
  },
  warning: {
    color: '#F59E0B',
    icon: <FaInfoCircle size={24} />,
    title: 'Warning',
    borderColor: '#F59E0B',
    buttonColor: '#F59E0B',
    buttonHover: '#d97706'
  }
};

const StatusModal = React.forwardRef(({ open, message, type = 'info', onClose }, ref) => {
  if (!open) return null;
  
  const config = typeConfig[type] || typeConfig.info;

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: type === 'success' ? config.overlayColor : 'rgba(20,22,34,0.55)',
      zIndex: 40000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.4s ease-out',
      backdropFilter: type === 'success' ? 'blur(8px)' : 'blur(4px)',
    }}>
      <div 
        ref={ref}
        style={{
          width: '100%',
          maxWidth: 450,
          background: type === 'success' ? config.modalBackground : '#fff',
          borderRadius: '20px',
          color: type === 'success' ? config.textColor : '#222',
          padding: '2.5rem 2rem 2rem 2rem',
          boxShadow: type === 'success' 
            ? '0 20px 40px rgba(99, 102, 241, 0.25), 0 8px 16px rgba(0,0,0,0.15)' 
            : '0 12px 28px rgba(0,0,0,0.2)',
          borderLeft: type === 'success' ? '6px solid #4F46E5' : `5px solid ${config.borderColor}`,
          backgroundImage: type === 'success' 
            ? 'linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 50%, #A5B4FC 100%)' 
            : 'linear-gradient(to bottom, #ffffff, #fdf9f4)',
          animation: 'fadeInScale 0.4s ease-out',
          position: 'relative',
          border: type === 'success' ? '1px solid rgba(79, 70, 229, 0.2)' : 'none',
        }}
      >
        {/* Enhanced Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: type === 'success' 
              ? 'linear-gradient(135deg, #EEF2FF, #C7D2FE)' 
              : 'rgba(255,255,255,0.9)',
            border: type === 'success' ? '2px solid rgba(79, 70, 229, 0.3)' : 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: type === 'success' 
              ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
              : '0 2px 8px rgba(0,0,0,0.10)',
            zIndex: 99999,
            fontSize: 22,
            color: config.color,
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
          }}
          title="Close"
          onMouseEnter={e => {
            if (type === 'success') {
              e.currentTarget.style.background = 'linear-gradient(135deg, #C7D2FE, #A5B4FC)';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
            } else {
              e.currentTarget.style.background = '#FFE0B2';
            }
          }}
          onMouseLeave={e => {
            if (type === 'success') {
              e.currentTarget.style.background = 'linear-gradient(135deg, #EEF2FF, #C7D2FE)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
            } else {
              e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
            }
          }}
        >
          <IoMdClose />
        </button>

        {/* Enhanced Header with Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: type === 'success' ? 24 : 20,
          marginBottom: 20,
          gap: 14,
          color: config.color,
          textShadow: type === 'success' ? '0 1px 2px rgba(49, 46, 129, 0.1)' : 'none',
        }}>
          <div style={{
            background: type === 'success' 
              ? 'linear-gradient(135deg, #EEF2FF, #C7D2FE)' 
              : 'transparent',
            borderRadius: '50%',
            padding: type === 'success' ? '8px' : '0',
            boxShadow: type === 'success' 
              ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
              : 'none',
          }}>
            {config.icon}
          </div>
          {config.title}
        </div>

        {/* Enhanced Message */}
        <div style={{
          fontSize: 16,
          color: type === 'success' ? '#312E81' : '#555',
          marginBottom: 28,
          wordBreak: 'break-word',
          textAlign: 'center',
          lineHeight: 1.6,
          fontWeight: type === 'success' ? 500 : 400,
          padding: type === 'success' ? '16px 20px' : '0',
          background: type === 'success' 
            ? 'linear-gradient(135deg, rgba(238, 242, 255, 0.5), rgba(199, 210, 254, 0.3))' 
            : 'transparent',
          borderRadius: type === 'success' ? '12px' : '0',
          border: type === 'success' ? '1px solid rgba(79, 70, 229, 0.2)' : 'none',
        }}>
          {message}
        </div>

        {/* Enhanced Action Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            onClick={onClose}
            style={{
              background: type === 'success' 
                ? 'linear-gradient(135deg, #4F46E5, #3730A3)' 
                : config.buttonColor,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: type === 'success' 
                ? '0 6px 20px rgba(79, 70, 229, 0.4)' 
                : `0 4px 12px ${config.buttonColor}40`,
              transition: 'all 0.3s ease',
              minWidth: 120,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={e => {
              if (type === 'success') {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3730A3, #312E81)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.5)';
              } else {
                e.currentTarget.style.background = config.buttonHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (type === 'success') {
                e.currentTarget.style.background = 'linear-gradient(135deg, #4F46E5, #3730A3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)';
              } else {
                e.currentTarget.style.background = config.buttonColor;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            OK
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            backdrop-filter: blur(0px);
          }
          to { 
            opacity: 1; 
            backdrop-filter: blur(8px);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
});

StatusModal.displayName = 'StatusModal';

export default StatusModal; 

export const ConfirmStopTestModal = ({ open, filename, onConfirm, onCancel }) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(26, 17, 17, 0.75)', zIndex: 40000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.4s ease-out',
      backdropFilter: 'blur(1px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#fff', borderRadius: '16px',
        padding: 24, boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
        position: 'relative',
        textAlign: 'center',
      }}>
        <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 'bold', color: '#FF6D00' }}>Stop Running Test?</h2>
        <p style={{ fontSize: 16, marginBottom: 32, color:'black' }}>
          Are you sure you want to stop the test for <b>{filename}</b>?
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 30px', fontSize: 16,
              background: '#9f9f9fff', border: 'none', borderRadius: 12,
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ccc'}
            onMouseLeave={e => e.currentTarget.style.background = '#ddd'}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: '12px 30px', fontSize: 16,
              background: '#FF6D00', color: '#fff', border: 'none', borderRadius: 12,
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e65c00'}
            onMouseLeave={e => e.currentTarget.style.background = '#FF6D00'}
          >
            Stop Test
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0); }
          to { opacity: 1; backdrop-filter: blur(4px); }
        }
      `}</style>
    </div>,
    document.body
  );
};