import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import DailyPrediction from "./pages/DailyPrediction";
import MonthlyPrediction from "./pages/MonthlyPrediction";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";

function AppContent({ isAdmin, setIsAdmin }) {
  const location = useLocation();
  
  const showThemeToggle = ["/daily", "/monthly"].includes(location.pathname);

  return (
    <>
      <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      {showThemeToggle && <ThemeToggle />}
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/daily" element={<DailyPrediction />} />
        <Route path="/monthly" element={<MonthlyPrediction />} />
        <Route path="/login" element={<LoginPage setIsAdmin={setIsAdmin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === "admin") {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <AppContent isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      </Router>
    </ThemeProvider>
  );
}

export default App;