import React from "react";
import { Link } from "react-router-dom";
import SolanaPrice from "../components/SolanaPrice";
import solbg2 from "../assets/solbg2.png";

function LandingPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",   // ✅ vertikal center
        alignItems: "center",       // ✅ horizontal center
        textAlign: "center",
        minHeight: "100vh",         // full screen tinggi
        padding: "20px",
        backgroundImage: `url(${solbg2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>
        Solana Price Prediction App
      </h1>

      <SolanaPrice />

      <div style={{ marginTop: "40px" }}>
        <Link to="/daily">
          <button
            style={{
              margin: "10px",
              padding: "15px 30px",
              fontSize: "16px",
              cursor: "pointer",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Prediksi Harian
          </button>
        </Link>

        <Link to="/monthly">
          <button
            style={{
              margin: "10px",
              padding: "15px 30px",
              fontSize: "16px",
              cursor: "pointer",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Prediksi Bulanan
          </button>
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;