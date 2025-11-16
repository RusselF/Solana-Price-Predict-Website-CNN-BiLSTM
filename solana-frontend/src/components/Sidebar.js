import React from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar({ role, isOpen, onClose }) {
  const location = useLocation();

  // Untuk highlight menu yang sedang aktif
  const isActive = (path) => location.pathname === path;

  const menuStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 5px",
    color: isActive(path) ? "#00FFA3" : "#fff",
    fontWeight: isActive(path) ? "700" : "400",
    textDecoration: "none",
    fontSize: "16px",
    transition: "0.2s ease",
  });

  return (
    <>
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

      <div
        style={{
          width: "240px",
          background: "#0f1117",
          color: "#fff",
          height: "100vh",
          padding: "25px 20px",
          position: "fixed",
          top: 0,
          left: isOpen ? "0" : "-100%",
          transition: "left 0.3s ease",
          zIndex: 1000,
          boxShadow: "3px 0 10px rgba(0,0,0,0.4)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* HEADER */}
        <h3
          style={{
            marginBottom: "35px",
            color: "#00FFA3",
            fontSize: "20px",
            fontWeight: "700",
            letterSpacing: "0.5px",
          }}
        >
          {role === "admin"
            ? "Admin Panel"
            : "User Panel"}
        </h3>

        {/* MENU LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          <Link to="/" style={menuStyle("/")} onClick={onClose}>
            <span>🏠</span> Home
          </Link>

          <Link to="/daily" style={menuStyle("/daily")} onClick={onClose}>
            <span>📅</span> Prediksi Harian
          </Link>

          <Link to="/monthly" style={menuStyle("/monthly")} onClick={onClose}>
            <span>📆</span> Prediksi Bulanan
          </Link>

          <Link to="/about" style={menuStyle("/about")} onClick={onClose}>
            <span>ℹ️</span> About
          </Link>
        </div>

        {/* DIVIDER */}
        <hr
          style={{
            border: "0.5px solid rgba(255,255,255,0.1)",
            margin: "25px 0",
          }}
        />

        {/* ADMIN SECTION */}
        {role === "admin" && (
          <div>
            <Link
              to="/admin"
              style={{
                ...menuStyle("/admin"),
                color: "#00FFA3",
                fontWeight: "700",
              }}
              onClick={onClose}
            >
              <span>📘</span> Documentation
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;