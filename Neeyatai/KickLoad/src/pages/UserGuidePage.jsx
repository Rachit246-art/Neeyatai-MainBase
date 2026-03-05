import React from "react";

function UserGuidePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #FFF8F1, #FFF1E6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "40px 20px",
        color: "#333",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(1.8rem, 5vw, 2.4rem)",
          fontWeight: "900",
          color: "#FF6D00",
          marginBottom: "24px",
        }}
      >
        KickLoad User Guide 📘
      </h1>

      <p
        style={{
          fontSize: "1.1rem",
          color: "#555",
          maxWidth: "700px",
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "30px",
        }}
      >
        Learn how to use KickLoad for performance testing — from setup to
        advanced analytics. You can download or read the guide below.
      </p>

      <a
        href="/user-guide-kickload.pdf"
        download
        style={{
          display: "inline-block",
          background: "#FF6D00",
          color: "#fff",
          fontWeight: "600",
          padding: "12px 24px",
          borderRadius: "10px",
          textDecoration: "none",
          marginBottom: "40px",
          boxShadow: "0 4px 12px rgba(255, 109, 0, 0.3)",
        }}
      >
        📥 Download PDF
      </a>

      <iframe
        src="/user-guide-kickload.pdf"
        title="KickLoad User Guide"
        width="80%"
        height="800px"
        style={{
          border: "none",
          borderRadius: "16px",
          boxShadow: "0 6px 20px rgba(255, 153, 102, 0.25)",
        }}
      ></iframe>
    </div>
  );
}

export default UserGuidePage;
