import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AUTH_API_URL = "http://127.0.0.1:8000/api";

function LoginPage({ setIsAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        email,
        password,
      });

      const userData = response.data;
      localStorage.setItem("user", JSON.stringify(userData));

      if (userData.role === "admin") {
        setIsAdmin(true);
        navigate("/admin");
      } else {
        setIsAdmin(false);
        navigate("/");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Login gagal. Periksa email dan password Anda.";
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
          Welcome Back
        </h2>
        <p className="text-center text-gray-300 mb-8">
          Sign in to access your crypto forecast dashboard
        </p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-400/30 text-red-300 p-3 rounded-xl text-sm animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="you@solana.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00FFA3] outline-none"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#9945FF] outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00FFA3] to-[#9945FF] hover:opacity-90 py-3 rounded-xl font-bold text-black shadow-lg transform hover:scale-[1.02] transition-all"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Don’t have an account?{" "}
          <span
            className="text-[#00FFA3] hover:text-[#9945FF] cursor-pointer font-semibold"
            onClick={() => navigate("/register")}
          >
            Register now
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

export default LoginPage;