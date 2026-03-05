import { height } from '@mui/system';
import React from 'react';
import ReactDOM from 'react-dom';
import { FaEye } from 'react-icons/fa';
import { FiEdit2, FiDownload, FiTrash2 } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';

// PDF Action Modal (Download, Rename, Delete, View)
export function PdfActionModal({ open, filename, onClose, onView, onRename, onDownload, onDelete, title }) {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Close Button */}
        <IoMdClose
          size={24}
          style={styles.closeIcon}
          onClick={onClose}
          title="Close"
        />

        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.headerText}>{title || 'PDF Generated!'}</h3>
        </div>

        {/* Filename */}
        <div style={styles.filename}>{filename}</div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <ActionButton
            label="View"
            icon={<FaEye />}
            onClick={onView}
            theme="orange"
          />
          <ActionButton
            label="Rename"
            icon={<FiEdit2 />}
            onClick={onRename}
            theme="blue"
          />
          <ActionButton
            label="Download"
            icon={<FiDownload />}
            onClick={onDownload}
            theme="green"
          />
          <ActionButton
            label="Delete"
            icon={<FiTrash2 />}
            onClick={onDelete}
            theme="red"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// Reusable Action Button Component
const ActionButton = ({ label, icon, onClick, theme }) => {
  const colors = {
    orange: ['#FF6D00', '#FFF3E0'],
    blue: ['#0096FF', '#EAF6FF'],
    green: ['#2ecc40', '#E9FCEB'],
    red: ['#E14434', '#FFEAEA'],
  };
  const [base, light] = colors[theme] || ['#444', '#EEE'];

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.actionBtn,
        borderColor: base,
        color: base,
        background: '#fff',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = light;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#fff';
      }}
    >
      {React.cloneElement(icon, { size: 18, style: { marginRight: 6 } })}
      {label}
    </button>
  );
};

// File Viewer Modal
export function FileViewerModal({ open, title = 'File Content', content = '', fileUrl = '', onClose }) {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div style={styles.overlay}>
      <div style={styles.viewerModal}>
        <IoMdClose
          size={24}
          style={styles.viewerClose}
          onClick={onClose}
          title="Close"
        />

        <h3 style={styles.viewerHeader}>{title}</h3>

        {fileUrl ? (
          <iframe
            src={fileUrl}
            title="File Preview"
            style={styles.iframe}
          />
        ) : (
          <pre style={styles.viewerContent}>{content}</pre>
        )}
      </div>
    </div>,
    document.body
  );
}

// Styles
const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    width:  '90%', maxWidth: 480,
    position: 'absolute',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    padding: '1rem',
    overflow: 'hidden'
  },
  closeIcon: {
    position: 'absolute', top: 12, right: 12,
    cursor: 'pointer', color: '#555'
  },
  header: {
    borderBottom: '1px solid #eee',
    paddingBottom: 8,
    marginBottom: 16
  },
  headerText: {
    margin: 0,
    fontSize: 20,
    color: '#333',
    textAlign: 'center'
  },
  filename: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    wordBreak: 'break-all'
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: 8
  },
  actionBtn: {
    border: '2px solid',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  // FileViewerModal styles
  viewerModal: {
    width: '70%', height: '85%',
    background: '#f9f9f9',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    position: 'relative',
    padding: '1rem',
    display: 'flex', flexDirection: 'column'
  },
  viewerClose: {
    position: 'absolute', top: 12, right: 12,
    cursor: 'pointer', color: '#333'
  },
  viewerHeader: {
    margin: 0,
    fontSize: 18,
    color: '#222',
    textAlign: 'center',
    marginBottom: 12
  },
  iframe: {
    flex: 1,
    border: 'none',
    borderRadius: 8,
    width: '100%',
    height: '100%'
  },
  viewerContent: {
    flex: 1,
    overflow: 'auto',
    background: '#fff',
    borderRadius: 6,
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#111'
  }
};
