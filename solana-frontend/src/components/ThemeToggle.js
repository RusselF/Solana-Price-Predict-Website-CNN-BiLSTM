import React from "react";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "2px solid",
        borderColor: theme === "light" ? "#e5e7eb" : "#374151",
        background: theme === "light" ? "#ffffff" : "#1f2937",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        boxShadow: theme === "light" 
          ? "0 4px 6px rgba(0, 0, 0, 0.1)" 
          : "0 4px 6px rgba(0, 0, 0, 0.3)",
        transition: "all 0.3s ease",
        zIndex: 1000
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};