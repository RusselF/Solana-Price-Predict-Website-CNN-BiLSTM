import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Password tidak cocok!");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/register", {
        name,
        email,
        password,
      });

      alert("Registrasi berhasil! Silakan login.");
      navigate("/login");
    } catch (err) {
        if (err.response && err.response.data.message) {
            alert("Registrasi gagal: " + err.response.data.message);
        } else {
            alert("Terjadi error pada server.");
        }
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>📝 Register User Baru</h2>

      <form onSubmit={handleRegister} style={{ marginTop: "20px" }}>
        {/* Nama */}
        <input
          type="text"
          placeholder="Nama Lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: "10px",
            marginBottom: "10px",
            width: "250px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          required
        />
        <br />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "10px",
            marginBottom: "10px",
            width: "250px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          required
        />
        <br />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px",
            marginBottom: "10px",
            width: "250px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          required
        />
        <br />

        {/* Konfirmasi Password */}
        <input
          type="password"
          placeholder="Konfirmasi Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            padding: "10px",
            marginBottom: "20px",
            width: "250px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          required
        />
        <br />

        {/* Tombol Register */}
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;