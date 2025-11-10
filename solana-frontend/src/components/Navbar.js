import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "./Sidebar";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Ambil data user dari localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const handleStorageChange = () => {
      const updated = localStorage.getItem("user");
      setUser(updated ? JSON.parse(updated) : null);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
    window.location.reload();
  };

  const getInitial = (name) =>
    name ? name.split(" ")[0].charAt(0).toUpperCase() : "?";

  const isLanding = location.pathname === "/";

  // Glassmorphism style di semua halaman kecuali landing
  const navStyle = {
    padding: "15px 24px",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
    background: isLanding
      ? "transparent" // transparan penuh di landing page
      : theme === "light"
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(31, 41, 55, 0.6)",
    backdropFilter: isLanding ? "none" : "blur(12px)",
    WebkitBackdropFilter: isLanding ? "none" : "blur(12px)",
    borderBottom: isLanding
      ? "none"
      : theme === "light"
      ? "1px solid rgba(229,231,235,0.5)"
      : "1px solid rgba(55,65,81,0.6)",
    color: theme === "light" ? "#111827" : "#f9fafb",
  };

  const btnGradient = "linear-gradient(90deg, #00FFA3 0%, #9945FF 100%)";

  return (
    <>
      <nav style={navStyle}>
        {/* Left Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaBars
            style={{
              fontSize: "22px",
              cursor: "pointer",
              color: isLanding
                ? "#ffffff"
                : theme === "light"
                ? "#1f2937"
                : "#e5e7eb",
            }}
            onClick={() => setSidebarOpen(true)}
          />
          <h2
            onClick={() => navigate("/")}
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "1.1rem",
              cursor: "pointer",
              background: "linear-gradient(90deg, #9945FF, #00FFA3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SolanaView
          </h2>
        </div>

        {/* Right Section */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          {user ? (
            <>
              {/* Avatar */}
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #00FFA3, #9945FF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#000",
                  cursor: "pointer",
                  boxShadow: "0 3px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                {getInitial(user.name)}
              </div>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50px",
                    background:
                      theme === "light"
                        ? "rgba(255, 255, 255, 0.9)"
                        : "rgba(31, 41, 55, 0.95)",
                    border: theme === "light"
                      ? "1px solid rgba(229,231,235,0.6)"
                      : "1px solid rgba(55,65,81,0.7)",
                    borderRadius: "10px",
                    padding: "12px",
                    width: "160px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    color: theme === "light" ? "#111827" : "#f3f4f6",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <p
                    style={{
                      marginBottom: "10px",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    {user.name.split(" ")[0]}
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: 500,
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{
                background: btnGradient,
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={user?.role || "guest"}
      />
    </>
  );
}

export default Navbar;