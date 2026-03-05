import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaClock, FaCog, FaSignOutAlt, FaBars, FaRedoAlt, FaBolt } from "react-icons/fa";


export const SettingsDropdown = ({
  open,
  onClose,
  navigate,
  license,
  handleLogout,
  handleUpgrade,
  openEmailSettingsModal,
  isMobile,
  licenseBox,
  parentRef,
  vusBox,
}) => {
  if (!open) return null;

  // Safe callbacks
  const safeOnClose = typeof onClose === 'function' ? onClose : () => { };
  const safeNavigate = typeof navigate === 'function' ? navigate : () => { };
  const safeHandleLogout = typeof handleLogout === 'function' ? handleLogout : () => { };
  const safeHandleUpgrade = typeof handleUpgrade === 'function' ? handleUpgrade : () => { };
  const safeOpenEmailSettingsModal = typeof openEmailSettingsModal === 'function' ? openEmailSettingsModal : () => { };

  return (
    <div
      className="modal-transition"
      ref={parentRef}
      style={{
        position: "fixed",
        top: 70, // below header
        right: 12,
        background: "linear-gradient(135deg, rgba(26,26,46,0.98), rgba(22,33,62,0.98))",
        borderRadius: "12px",
        padding: "clamp(8px, 2vw, 16px)",
        minWidth: "clamp(120px, 28vw, 200px)",
        zIndex: 99999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.2)",
        fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
        maxWidth: "98vw",
        wordBreak: "break-word",
        animation: "fadeInUp 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 12px)" }}>
        {isMobile && (
          <>
            {licenseBox}
            {vusBox}
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
          </>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            color: "#fff",
            padding: 8,
            borderRadius: 6,
            transition: "all 0.2s ease",
          }}
          onClick={() => { safeOnClose(); safeNavigate('/profile'); }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <FaUser style={{ color: "#667eea" }} /> Profile Settings
        </div>

        {license && typeof license === 'string' && license.includes("Premium") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              color: "#fff",
              padding: 8,
              borderRadius: 6,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <FaClock style={{ color: "#4facfe" }} /> Premium Plan
          </div>
        )}

        <div
          onClick={() => { safeOnClose(); safeHandleUpgrade(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            color: "#fff",
            background: "rgba(255,109,0,0.15)",
            padding: 8,
            borderRadius: 6,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,109,0,0.25)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,109,0,0.15)"}
        >
          <FaUser style={{ color: "#FF6D00" }} /> Upgrade to Premium
        </div>

        <div
          onClick={() => { safeOnClose(); safeOpenEmailSettingsModal(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            color: "#fff",
            background: "rgba(0, 150, 255, 0.10)",
            padding: 8,
            borderRadius: 6,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0, 150, 255, 0.18)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0, 150, 255, 0.10)"}
        >
          <FaCog style={{ color: "#0096FF" }} /> Email Settings
        </div>

        <div
          onClick={() => { safeOnClose(); safeNavigate('/gatling'); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            color: "#fff",
            background: "rgba(255, 140, 0, 0.10)",
            padding: 8,
            borderRadius: 6,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 140, 0, 0.18)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 140, 0, 0.10)"}
        >
          <FaBolt style={{ color: "#FF8C00" }} /> Gatling
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

        <div
          onClick={() => { safeOnClose(); safeHandleLogout(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            color: "#fff",
            padding: 8,
            borderRadius: 6,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <FaSignOutAlt style={{ color: "#f5576c" }} /> Sign out
        </div>
      </div>
    </div>
  );
};


const Header = ({
  license,
  nextReset,
  remainingUsers,
  showVUs,
  isMobile,
  sidebarOpen,
  setSidebarOpen,
  dropdownOpen,
  setDropdownOpen,
  dropdownRef,
  onLogout,
  handleUpgrade,
  openEmailSettingsModal,
}) => {
  const navigate = useNavigate();

  const isExpired = (license) =>
    typeof license === "string" && license.toLowerCase().includes("expired");

  const licenseBox = (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-md border ${isExpired(license)
        ? "bg-orange-100/10 border-orange-300/20 text-orange-400"
        : "bg-white/10 border-white/20 text-white/70"
        }`}
    >
      <FaClock className="text-sm" />
      <span className={`text-sm font-medium ${isExpired(license) ? "text-red-500" : "text-white"}`}>
        {license}
      </span>
    </div>
  );


  const vusBox = showVUs && (
    <div className="px-4 py-2 rounded-md border bg-white/10 border-white/20 text-white/80 shadow-sm">
      <div className="flex items-center gap-2">
        <FaUser className="text-base" />
        <span className="text-sm font-semibold text-white">
          {remainingUsers?.toLocaleString()} VUs
        </span>
      </div>
      {nextReset && (
        <div className="flex items-center gap-1 mt-1 text-xs text-white/60">
          <FaRedoAlt className="text-xs" />
          <span>
            Renews {nextReset.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="z-5000 fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-4 bg-gradient-to-r from-[#1e202a] to-[#303952] text-white border-b border-white/10">
      {isMobile && (
        <button onClick={() => setSidebarOpen?.(prev => !prev)}
          className="!text-2xl !p-2 !hover:bg-white/10">
          <FaBars />
        </button>
      )}
      <div className="ml-5 text-3xl font-extrabold uppercase bg-gradient-to-r from-orange-500 via-black to-white bg-clip-text text-transparent bg-[length:600%] animate-gradient">
        KickLoad
      </div>



      {!isMobile ? (
        <div ref={dropdownRef} className="flex items-center space-x-6 mr-2">
          {licenseBox}
          {vusBox}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(prev => !prev)
            }}

            className="!p-3 !rounded-lg !bg-white/10 !border !border-white/20 !hover:bg-white/20"
          >
            <FaCog className={`transition-transform ${dropdownOpen ? "rotate-90" : ""}`} />
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(prev => !prev)
          }}

          className="!p-3 !rounded-lg !bg-white/10 !border !border-white/20"
        >
          <FaCog className={`transition-transform ${dropdownOpen ? "rotate-90" : ""}`} />
        </button>
      )}
    </div>
  );
};

export default Header;
