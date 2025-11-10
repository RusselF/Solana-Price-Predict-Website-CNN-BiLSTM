import React from "react";
import { Link } from "react-router-dom";

function Sidebar({ role, isOpen, onClose }) {
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
          width: "220px",
          background: "#111",
          color: "#fff",
          height: "100vh",
          padding: "20px",
          position: "fixed",
          top: 0,
          left: isOpen ? "0" : "-100%",
          transition: "left 0.3s ease",
          zIndex: 1000,
          boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ marginBottom: "30px", color: "#00FFA3" }}>
          {role === "admin" ? "Admin Panel" : "User Panel"}
        </h3>

        <p>
          <Link to="/" style={{ color: "#fff" }} onClick={onClose}>
            🏠 Home
          </Link>
        </p>
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

        {role === "admin" && (
          <>
            <hr style={{ border: "0.5px solid #333", margin: "15px 0" }} />
            <p>
              <Link
                to="/admin"
                style={{ color: "#00FFA3", fontWeight: "bold" }}
                onClick={onClose}
              >
                📘 Documentation
              </Link>
            </p>
          </>
        )}
      </div>
    </>
  );
}

export default Sidebar;