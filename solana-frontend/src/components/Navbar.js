import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cek apakah di halaman prediction
  const isPredictionPage = ["/daily", "/monthly"].includes(location.pathname);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Style navbar berdasarkan halaman
  const navbarStyle = isPredictionPage
    ? {
        // Di prediction page: ikut theme
        padding: "15px 20px",
        background: theme === "light" ? "#1f2937" : "#f9fafb",
        color: theme === "light" ? "#fff" : "#1f2937",
        boxShadow: theme === "light" 
          ? "0 2px 8px rgba(0,0,0,0.1)" 
          : "0 2px 8px rgba(0,0,0,0.05)",
      }
    : {
        // Di landing page: transparan
        padding: "10px 20px",
        background: "rgba(0, 0, 0, 0)",
        color: "#fff",
      };

  const iconColor = isPredictionPage
    ? theme === "light" ? "#fff" : "#1f2937"
    : "#fff";

  const buttonColor = isPredictionPage
    ? theme === "light" ? "#4CAF50" : "#3b82f6"
    : "#4CAF50";

  return (
    <>
      {/* Navbar */}
      <nav
        style={{
          ...navbarStyle,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          transition: "all 0.3s ease",
        }}
      >
        {/* Hamburger + Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <FaBars
            style={{ 
              fontSize: "22px", 
              cursor: "pointer", 
              marginRight: "15px",
              color: iconColor 
            }}
            onClick={toggleSidebar}
          />
          <h2
            onClick={() => navigate("/")}
            style={{ 
              cursor: "pointer", 
              margin: 0,
              color: iconColor 
            }}
          >
            SolanaView
          </h2>
        </div>

        {/* Kanan */}
        <div style={{ position: "relative", paddingRight: "100px" }} ref={dropdownRef}>
          {user ? (
            <>
              {/* Avatar bulat */}
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "50%",
                  background: buttonColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                  color: "#fff",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 30,
                    top: "45px",
                    background: isPredictionPage 
                      ? (theme === "light" ? "#374151" : "#ffffff")
                      : "#222",
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    padding: "10px",
                    minWidth: "160px",
                    zIndex: 1001,
                    border: isPredictionPage 
                      ? (theme === "light" ? "1px solid #4b5563" : "1px solid #e5e7eb")
                      : "none",
                  }}
                >
                  <p style={{ 
                    margin: "0 0 10px", 
                    color: isPredictionPage 
                      ? (theme === "light" ? "#fff" : "#1f2937")
                      : "#fff"
                  }}>
                    {user.name}
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link to="/login">
              <button
                style={{
                  background: buttonColor,
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 1100,
          }}
        ></div>
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: sidebarOpen ? "0" : "-100%",
          width: "250px",
          height: "100vh",
          background: isPredictionPage
            ? (theme === "light" ? "#374151" : "#ffffff")
            : "#111",
          color: isPredictionPage
            ? (theme === "light" ? "#fff" : "#1f2937")
            : "#fff",
          padding: "20px",
          boxSizing: "border-box",
          zIndex: 1200,
          transition: "left 0.3s ease",
          boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
        }}
      >
        {/* Tombol Close */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <FaTimes
            style={{ 
              cursor: "pointer", 
              fontSize: "20px",
              color: isPredictionPage
                ? (theme === "light" ? "#fff" : "#1f2937")
                : "#fff"
            }}
            onClick={closeSidebar}
          />
        </div>

        <h3 style={{
          color: isPredictionPage
            ? (theme === "light" ? "#fff" : "#1f2937")
            : "#fff"
        }}>Menu</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "15px" }}>
            <Link 
              to="/" 
              style={{ 
                color: isPredictionPage
                  ? (theme === "light" ? "#d1d5db" : "#4b5563")
                  : "#fff",
                textDecoration: "none",
                fontSize: "16px",
              }} 
              onClick={closeSidebar}
            >
              🏠 Home
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link 
              to="/daily" 
              style={{ 
                color: isPredictionPage
                  ? (theme === "light" ? "#d1d5db" : "#4b5563")
                  : "#fff",
                textDecoration: "none",
                fontSize: "16px",
              }} 
              onClick={closeSidebar}
            >
              📅 Prediksi Harian
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link 
              to="/monthly" 
              style={{ 
                color: isPredictionPage
                  ? (theme === "light" ? "#d1d5db" : "#4b5563")
                  : "#fff",
                textDecoration: "none",
                fontSize: "16px",
              }} 
              onClick={closeSidebar}
            >
              📆 Prediksi 1 Bulan
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}

export default Navbar;