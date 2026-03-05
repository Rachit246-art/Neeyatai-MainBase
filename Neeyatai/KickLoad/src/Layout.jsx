import React, { useState, useRef, useEffect } from "react";
import Header, { SettingsDropdown } from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import { Outlet, useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import EmailSettingsModal from "./components/EmailSettingsModal";
import { useTestStore } from "./store/testStore";
import { FaUser, FaClock, FaRedoAlt } from "react-icons/fa";
import axiosInstance from "./api/axiosInstance";

function Layout({ licenseStatus, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [license, setLicense] = useState("");
  const { remainingUsers, setRemainingUsers } = useTestStore();
  const [nextReset, setNextReset] = useState(null);
  const [showVUs, setShowVUs] = useState(true);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    // Use 'click' event so toggle button click happens before outside detection
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);


  // Sidebar width for desktop
  const sidebarWidth = isCollapsed ? 80 : 220;

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
      <span
        className={`text-sm font-medium ${isExpired(license) ? "text-red-500" : "text-white"
          }`}
      >
        {license}
      </span>
    </div>
  );

  const vusBox =
    showVUs && (
      <div className="px-4 py-2 rounded-md border bg-white/10 border-white/20 text-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <FaUser className="text-base" />
          <span className="text-sm font-semibold text-white">
            {remainingUsers.toLocaleString()} VUs
          </span>
        </div>
        {nextReset && (
          <div className="flex items-center gap-1 mt-1 text-xs text-white/60">
            <FaRedoAlt className="text-xs" />
            <span>
              Renews{" "}
              {nextReset.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    );

  useEffect(() => {
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    let licenseText = "Trial Expired";
    let localStatus = "expired";

    try {
      const user = userStr ? JSON.parse(userStr) : null;
      const now = new Date();
      const trialEnd = user?.trial_ends_at ? new Date(user.trial_ends_at) : null;
      const paidEnd = user?.paid_ends_at ? new Date(user.paid_ends_at) : null;

      const formatDate = (date) =>
        date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

      if (paidEnd && paidEnd > now) {
        localStatus = "paid";
        licenseText = `Paid - Expires on ${formatDate(paidEnd)}`;
      } else if (trialEnd && trialEnd > now) {
        localStatus = "trial";
        licenseText = `Trial - Expires on ${formatDate(trialEnd)}`;
      }

      setLicense(licenseText);
      setShowVUs(localStatus !== "expired");
    } catch (e) {
      console.warn("User parse fail", e);
    }

    const fetchRemainingUsers = async () => {
      try {
        const res = await axiosInstance.get("/remaining-virtual-users");
        setRemainingUsers(res.data?.remaining_virtual_users ?? 0);
        if (res.data?.next_reset) {
          setNextReset(new Date(res.data.next_reset));
        }
      } catch (err) {
        console.error("Failed VU fetch", err);
        setRemainingUsers(0);
      }
    };
    fetchRemainingUsers();
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);  // ✅ always expand fully on mobile
    }
  }, [isMobile]);


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        position: "relative",
        background: "linear-gradient(to bottom, #FFE9D0, #FFF3E0)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Header
        license={license}
        nextReset={nextReset}
        remainingUsers={remainingUsers}
        showVUs={showVUs}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        dropdownRef={dropdownRef}   // ✅ pass ref here
        onLogout={onLogout}
        handleUpgrade={() => navigate("/payment")}
        openEmailSettingsModal={() => setEmailModalOpen(true)}
      />

      {ReactDOM.createPortal(

        <SettingsDropdown
          open={dropdownOpen}
          parentRef={dropdownRef}
          onClose={() => setDropdownOpen(false)}
          navigate={navigate}
          license={license}
          handleLogout={onLogout}
          handleUpgrade={() => navigate("/payment")}
          openEmailSettingsModal={() => setEmailModalOpen(true)}
          isMobile={isMobile}
          licenseBox={licenseBox}
          vusBox={vusBox}
        />,
        document.body
      )}

      {ReactDOM.createPortal(
        <EmailSettingsModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
        />,
        document.body
      )}

      {/* Sidebar and main layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          width: "100%",
          maxWidth: "100%",
          minHeight: "calc(100vh - 80px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Sidebar: show on desktop; on mobile only when open */}
        {(!isMobile || (isMobile && sidebarOpen)) && (
          <div
            style={{
              width: isMobile ? "100vw" : sidebarWidth,
              minWidth: isMobile ? "100vw" : sidebarWidth,
              maxWidth: isMobile ? "100vw" : sidebarWidth,
              position: isMobile ? "fixed" : "sticky",
              top: isMobile ? 0 : 80,
              left: 0,
              height: "100vh",
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
              background: "transparent", // sidebar has its own bg
              overflow: "visible",       // ✅ allow internal scroll from Sidebar

            }}
          >

            <Sidebar
              isMobile={isMobile}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
          </div>

        )}

        {/* Mobile overlay */}
        {isMobile && (
          // In Layout.jsx (mobile overlay)
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              opacity: sidebarOpen ? 1 : 0,
              pointerEvents: sidebarOpen ? "auto" : "none",

              zIndex: 1200,
              transition: "opacity 0.3s ease",
            }}
            onClick={() => setSidebarOpen(false)}
          />

        )}


        {/* Main content */}
        <div
          className="route-transition"
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            overflowX: "hidden",
            paddingTop: "80px",
            padding:
              "clamp(16px, 4vw, 32px) clamp(0px, 2vw, 0px) clamp(4px, 2vw, 0px)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            // Blur + disable interaction when sidebar open on mobile
            pointerEvents: isMobile && sidebarOpen ? "none" : "auto",
            filter: isMobile && sidebarOpen ? "blur(2px)" : "none",
          }}
        >
          <main
            className="page-loaded"
            style={{
              flexGrow: 1,
              width: "100%",
              maxWidth: "100%",
              minHeight: "calc(100vh - 80px)",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Outlet />
          </main>
          <div style={{ position: "relative", bottom: "-4px", overflow: "hidden" }}>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
