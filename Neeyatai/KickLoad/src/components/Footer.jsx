"use client"

function Footer() {
  return (
    <footer
      style={{
        padding: "20px 24px",
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #EAEAEA",
        color: "#555555",
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#333333",
        }}
      >
        Copyrights &copy; 2025{" "}
        <a
          href="https://www.neeyatai.com/"
          style={{
            color: "#FF6D00",
            textDecoration: "none",
            fontWeight: "600",
          }}
          target="_blank"
          rel="noreferrer"
        >
          NeeyatAI
        </a>
        . All rights reserved.
      </p>
      <p
        style={{
          margin: 0,
          color: "#333333",
        }}
      >
        <a
          href="#"
          style={{
            color: "#555555",
            textDecoration: "none",
            marginLeft: "8px",
          }}
        >
          neeyatai.help@gmail.com
        </a>
      </p>
      <style>{`
        @media (max-width: 1400px) {
          footer {
            padding: clamp(16px, 2.5vw, 24px) !important;
            font-size: clamp(0.95rem, 1.5vw, 1.1rem) !important;
          }
          footer p {
            font-size: clamp(0.9rem, 1.5vw, 1rem) !important;
          }
        }
        @media (max-width: 1200px) {
          footer {
            padding: clamp(14px, 2.5vw, 22px) !important;
            font-size: clamp(0.9rem, 1.8vw, 1.05rem) !important;
          }
          footer p {
            font-size: clamp(0.85rem, 1.8vw, 0.95rem) !important;
          }
        }
        @media (max-width: 900px) {
          footer {
            padding: clamp(12px, 3vw, 18px) !important;
            font-size: clamp(0.95rem, 2vw, 1.05rem) !important;
            gap: clamp(12px, 2vw, 16px) !important;
          }
          footer p {
            font-size: clamp(0.9rem, 2vw, 1rem) !important;
          }
        }
        @media (max-width: 768px) {
          footer {
            flex-direction: column !important;
            gap: clamp(8px, 2vw, 12px) !important;
            padding: clamp(8px, 2vw, 14px) !important;
            font-size: clamp(0.9rem, 2vw, 1rem) !important;
            text-align: center !important;
          }
          footer p {
            font-size: clamp(0.85rem, 2vw, 0.95rem) !important;
            margin: clamp(2px, 1vw, 4px) 0 !important;
          }
          footer a {
            font-size: clamp(0.85rem, 2vw, 0.95rem) !important;
          }
        }
        @media (max-width: 600px) {
          footer {
            flex-direction: column !important;
            gap: clamp(6px, 2vw, 10px) !important;
            padding: clamp(6px, 2vw, 10px) !important;
            font-size: clamp(0.85rem, 2vw, 0.95rem) !important;
            text-align: center !important;
          }
          footer p {
            font-size: clamp(0.8rem, 2vw, 0.9rem) !important;
            margin: clamp(1px, 1vw, 3px) 0 !important;
          }
          footer a {
            font-size: clamp(0.8rem, 2vw, 0.9rem) !important;
          }
        }
        @media (max-width: 480px) {
          footer {
            flex-direction: column !important;
            gap: clamp(4px, 2vw, 8px) !important;
            padding: clamp(4px, 2vw, 8px) !important;
            font-size: clamp(0.8rem, 2vw, 0.9rem) !important;
            text-align: center !important;
          }
          footer p {
            font-size: clamp(0.75rem, 2vw, 0.85rem) !important;
            margin: clamp(1px, 1vw, 2px) 0 !important;
          }
          footer a {
            font-size: clamp(0.75rem, 2vw, 0.85rem) !important;
          }
        }
        @media (max-width: 360px) {
          footer {
            flex-direction: column !important;
            gap: clamp(3px, 2vw, 6px) !important;
            padding: clamp(3px, 2vw, 6px) !important;
            font-size: clamp(0.75rem, 2vw, 0.85rem) !important;
            text-align: center !important;
          }
          footer p {
            font-size: clamp(0.7rem, 2vw, 0.8rem) !important;
            margin: clamp(1px, 1vw, 2px) 0 !important;
          }
          footer a {
            font-size: clamp(0.7rem, 2vw, 0.8rem) !important;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
