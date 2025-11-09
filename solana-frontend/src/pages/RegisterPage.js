import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AUTH_API_URL = "http://127.0.0.1:8000/api";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok!");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter!");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${AUTH_API_URL}/register`, { name, email, password });
      alert("✅ Registrasi berhasil! Silakan login.");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Registrasi gagal. Email mungkin sudah terdaftar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#101025] to-[#151540] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute w-[600px] h-[600px] bg-[#00FFA3]/10 rounded-full blur-3xl top-[-10%] left-[-15%] animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-[#9945FF]/10 rounded-full blur-3xl bottom-[-10%] right-[-15%] animate-pulse delay-500" />
      </div>

      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md text-white">
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-[#00FFA3] to-[#9945FF] bg-clip-text text-transparent mb-2">
          Create Your Solana Account
        </h2>
        <p className="text-center text-gray-300 mb-8">
          Join the next generation of decentralized finance
        </p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-400/30 text-red-300 p-3 rounded-xl text-sm animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00FFA3] outline-none"
            required
          />
          <input
            type="email"
            placeholder="you@solana.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00FFA3] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#9945FF] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#9945FF] outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00FFA3] to-[#9945FF] hover:opacity-90 py-3 rounded-xl font-bold text-black shadow-lg transform hover:scale-[1.02] transition-all"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{" "}
          <span
            className="text-[#00FFA3] hover:text-[#9945FF] cursor-pointer font-semibold"
            onClick={() => navigate("/login")}
          >
            Sign in here
          </span>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s; }
      `}</style>
    </div>
  );
}

export default RegisterPage;