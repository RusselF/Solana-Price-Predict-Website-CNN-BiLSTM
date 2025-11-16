import React from "react";
import { Link } from "react-router-dom";
import SolanaPrice from "../components/SolanaPrice";
import solbg2 from "../assets/solbg2.png";

function LandingPage() {
  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      
      {/* ===========================
          HERO SECTION (BACKGROUND SOLANA)
          =========================== */}
      <section
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundImage: `url(${solbg2})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          padding: "50px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "52px",
            fontWeight: "800",
            marginBottom: "10px",
            textShadow: "0 0 12px rgba(0,0,0,0.6)",
          }}
        >
          Solana Price Prediction App
        </h1>

        <p
          style={{
            fontSize: "20px",
            opacity: 0.9,
            maxWidth: "750px",
            marginBottom: "25px",
          }}
        >
          Real-time Solana forecasting using a CNN-BiLSTM deep learning model.
        </p>

        <SolanaPrice />

        <div style={{ marginTop: "35px" }}>
          <Link to="/daily">
            <button
              style={{
                margin: "10px",
                padding: "15px 30px",
                fontSize: "18px",
                fontWeight: "600",
                background: "#1d8bf1",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
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
                fontSize: "18px",
                fontWeight: "600",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Prediksi Bulanan
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;