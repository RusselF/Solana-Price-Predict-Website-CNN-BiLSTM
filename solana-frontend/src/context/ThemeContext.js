import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load from localStorage or default to light
    const saved = localStorage.getItem("app-theme");
    return saved || "light";
  });

  useEffect(() => {
    // Save to localStorage when theme changes
    localStorage.setItem("app-theme", theme);
    // Apply to body for global styles
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const colors = {
    light: {
      bg: "#ffffff",
      bgSecondary: "#f9fafb",
      bgTertiary: "#f3f4f6",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      cardBg: "#ffffff",
      cardBorder: "#e5e7eb",
      success: "#d1fae5",
      successText: "#065f46",
      successBorder: "#a7f3d0",
      warning: "#fff3cd",
      warningText: "#856404",
      warningBorder: "#fde68a",
      error: "#fef2f2",
      errorText: "#991b1b",
      errorBorder: "#fecaca",
      info: "#dbeafe",
      infoText: "#1e40af",
      infoBorder: "#bfdbfe",
      primary: "#3b82f6",
      primaryDark: "#2563eb",
      purple: "#8b5cf6",
      purpleDark: "#7c3aed",
      shadow: "rgba(0, 0, 0, 0.1)",
    },
    dark: {
      bg: "#111827",
      bgSecondary: "#1f2937",
      bgTertiary: "#374151",
      text: "#f9fafb",
      textSecondary: "#d1d5db",
      border: "#374151",
      cardBg: "#1f2937",
      cardBorder: "#374151",
      success: "#064e3b",
      successText: "#d1fae5",
      successBorder: "#065f46",
      warning: "#78350f",
      warningText: "#fef3c7",
      warningBorder: "#92400e",
      error: "#7f1d1d",
      errorText: "#fecaca",
      errorBorder: "#991b1b",
      info: "#1e3a8a",
      infoText: "#dbeafe",
      infoBorder: "#1e40af",
      primary: "#3b82f6",
      primaryDark: "#60a5fa",
      purple: "#8b5cf6",
      purpleDark: "#a78bfa",
      shadow: "rgba(0, 0, 0, 0.3)",
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: colors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};