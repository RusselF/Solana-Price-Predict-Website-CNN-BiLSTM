import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage({ setIsAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Call Laravel API
      const res = await axios.post("http://127.0.0.1:8000/api/login", {
        email,
        password,
      });

      // Simpan data user ke localStorage
      localStorage.setItem("user", JSON.stringify(res.data));

      // Cek role user
      if (res.data.role === "admin") {
        setIsAdmin(true);
        navigate("/admin"); // ke halaman admin
      } else {
        setIsAdmin(false);
        navigate("/"); // ke halaman user biasa
      }
    } catch (err) {
      alert("Email atau password salah!");
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>🔐 Login</h2>

      <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px", marginBottom: "10px", width: "250px" }}
          required
        /><br/>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", marginBottom: "20px", width: "250px" }}
          required
        /><br/>

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
      </form>

      <p style={{ marginTop: "15px" }}>
        Belum punya akun?{" "}
        <span
          style={{ color: "#007bff", cursor: "pointer" }}
          onClick={() => navigate("/register")}
        >
          Register di sini
        </span>
      </p>
    </div>
  );
}

export default LoginPage;