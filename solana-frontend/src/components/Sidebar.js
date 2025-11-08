import React from "react";
import { Link } from "react-router-dom";

function Sidebar({ role, isOpen, onClose }) {
  return (
    <>
      {/* Overlay hitam, klik untuk nutup */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        ></div>
      )}

      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          background: "#1a1a1a",
          color: "#fff",
          height: "100vh",
          padding: "20px",
          position: "fixed",
          top: 0,
          left: isOpen ? "0" : "-100%",
          transition: "left 0.3s ease",
          zIndex: 1000,
        }}
      >
        <h3 style={{ marginBottom: "30px" }}>
          {role === "admin" ? "Admin Panel" : "User Panel"}
        </h3>

        {role === "admin" ? (
          <>
            <p>
              <Link to="/admin" style={{ color: "#fff" }} onClick={onClose}>
                🏠 Dashboard
              </Link>
            </p>
            <p>
              <Link to="/admin/users" style={{ color: "#fff" }} onClick={onClose}>
                👥 Kelola User
              </Link>
            </p>
            <p>
              <Link to="/admin/reports" style={{ color: "#fff" }} onClick={onClose}>
                📊 Laporan
              </Link>
            </p>
          </>
        ) : (
          <>
            <p>
              <Link to="/daily" style={{ color: "#fff" }} onClick={onClose}>
                📅 Prediksi Harian
              </Link>
            </p>
            <p>
              <Link to="/monthly" style={{ color: "#fff" }} onClick={onClose}>
                📆 Prediksi Bulanan
              </Link>
            </p>
          </>
        )}
      </div>
    </>
  );
}

export default Sidebar;
