import ReactDOM from 'react-dom';
import { FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

// Disconnect Confirm Modal
export const DisconnectConfirmModal = ({ open, onClose, onConfirm }) => {
  if (!open) return null;
  return ReactDOM.createPortal(
    <BaseModal background="#d32f2f" icon={<FaTimesCircle size={26} />} title="Confirm Disconnect">
      <div style={styles.message}>
        Are you sure you want to disconnect from GitHub?
        <br /><br />
        This will remove your GitHub connection and clear all repository settings.
      </div>
      <ActionButtons
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmText="Disconnect"
        confirmColor="red"
      />
    </BaseModal>,
    document.body
  );
};

// Disconnect Loading Modal
export const DisconnectLoadingModal = ({ open }) => {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div style={styles.overlay('#000', 0.75)}>
      <div style={{ ...styles.modalBox, borderLeft: '5px solid #FF6D00' }}>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner} />
        </div>
        <div style={styles.header('#FF6D00', 20)}>Disconnecting from GitHub</div>
        <div style={styles.message}>Please wait while we disconnect your GitHub account...</div>
        <style>{animations}</style>
      </div>
    </div>,
    document.body
  );
};

// Generic Confirm Modal (for OAuth etc.)
export const ConfirmModal = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div style={styles.overlay('#141622', 0.55)}>
      <div style={styles.modalBoxLight}>
        <div style={styles.header('#FF7A00', 20)}>
          <FaInfoCircle size={24} /> Confirm Action
        </div>
        <div style={styles.messageLight}>{message}</div>
        <div style={styles.buttonGroup}>
          <StyledButton text="Cancel" color="#6c757d" onClick={onCancel} />
          <StyledButton text="Confirm" color="#FF7A00" onClick={onConfirm} />
        </div>
      </div>
      <style>{animations}</style>
    </div>,
    document.body
  );
};

// Helper: Modal Wrapper
const BaseModal = ({ children, background, icon, title }) => (
  <div style={styles.overlay('#000', 0.55)}>
    <div style={{ ...styles.modalBox, borderLeft: `5px solid ${background}` }}>
      <div style={styles.header(background, 22)}>{icon} {title}</div>
      {children}
      <style>{animations}</style>
    </div>
  </div>
);

// Helper: Confirm / Cancel Buttons
const ActionButtons = ({ onCancel, onConfirm, confirmText, confirmColor }) => (
  <div style={styles.buttonGroup}>
    <StyledButton text="Cancel" color="#4a4a4a" onClick={onCancel} />
    <StyledButton text={confirmText} color={confirmColor} onClick={onConfirm} />
  </div>
);

// Helper: Button
const StyledButton = ({ text, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: color,
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      padding: '12px 24px',
      fontWeight: 600,
      fontSize: 15,
      cursor: 'pointer',
      boxShadow: `0 4px 12px ${color === '#6c757d' ? 'rgba(108,117,125,0.3)' : 'rgba(255,122,0,0.3)'}`,
      transition: 'all 0.2s ease',
      minWidth: 100,
    }}
  >
    {text}
  </button>
);

// Shared styles
const styles = {
  overlay: (color, opacity) => ({
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: `rgba(${color === '#000' ? '0,0,0' : '20,22,34'}, ${opacity})`,
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    animation: 'fadeIn 0.3s ease-out',
    padding: 20,
    overflowY: 'auto',
  }),
  modalBox: {
    width: '100%',
    maxWidth: 480,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    borderRadius: 20,
    color: '#ffffff',
    padding: '2.5rem 2rem 2rem 2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
    animation: 'fadeInScale 0.3s ease-out',
    position: 'relative',
    backdropFilter: 'blur(8px)',
  },
  modalBoxLight: {
    width: '100%',
    maxWidth: 480,
    background: 'linear-gradient(to bottom, #ffffff, #fdf9f4)',
    borderRadius: 18,
    color: '#222',
    padding: '2rem 1.5rem 1.5rem 1.5rem',
    boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
    borderLeft: '5px solid #FF7A00',
    animation: 'fadeInScale 0.3s ease-out',
    position: 'relative',
  },
  header: (color, size) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    fontWeight: 700,
    fontSize: size,
    marginBottom: 20,
    color,
    textShadow: color === '#d32f2f' ? '0 0 10px rgba(211,47,47,0.3)' : 'none',
  }),
  message: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 1.6,
    whiteSpace: 'pre-line',
  },
  messageLight: {
    fontSize: 15,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 1.5,
    whiteSpace: 'pre-line',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
  },
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  },
  spinner: {
    width: 60,
    height: 60,
    border: '4px solid rgba(255,109,0,0.3)',
    borderTop: '4px solid #FF6D00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Shared animations
const animations = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
`;
