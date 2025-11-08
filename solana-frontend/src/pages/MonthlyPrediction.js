import React, { useEffect, useState } from "react";
import axios from "axios";
import PredictionChart from "../components/PredictionChart";
import { useTheme } from "../context/ThemeContext";

function MonthlyPrediction() {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState("Memuat data...");
  const [error, setError] = useState(null);

  useEffect(() => {
    setProgress("🔄 Mengambil data dari API...");
    setInitialLoading(true);

    axios.get("http://127.0.0.1:8001/forecast")
      .then(res => {
        setProgress("✅ Memproses data...");
        setTimeout(() => {
          setData(res.data);
          setInitialLoading(false);
        }, 300);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || "Gagal memuat data");
        setProgress("❌ Gagal memuat data!");
        setInitialLoading(false);
      });
  }, []);

  if (initialLoading) {
    return (
      <div style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        background: colors.bg
      }}>
        <div style={{
          padding: 30,
          border: `2px solid ${colors.border}`,
          borderRadius: 12,
          background: colors.bgSecondary,
          textAlign: "center",
          maxWidth: 400
        }}>
          <div style={{
            width: 50,
            height: 50,
            border: `4px solid ${colors.border}`,
            borderTop: `4px solid ${colors.purple}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          
          <h2 style={{ margin: "0 0 10px 0", color: colors.text }}>
            ⏳ Memuat Data
          </h2>
          <p style={{ color: colors.textSecondary, margin: 0 }}>{progress}</p>
          
          <div style={{
            marginTop: 15,
            padding: 10,
            background: colors.warning,
            borderRadius: 6,
            fontSize: "13px",
            color: colors.warningText
          }}>
            💡 <b>Tips:</b> Request pertama mungkin memakan waktu 3-5 detik. 
            Setelah itu, data akan di-cache untuk akses yang lebih cepat!
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || (!data && !initialLoading)) {
    return (
      <div style={{ padding: 20, background: colors.bg, minHeight: "60vh" }}>
        <div style={{
          padding: 20,
          background: colors.error,
          border: `1px solid ${colors.errorBorder}`,
          borderRadius: 8,
          color: colors.errorText
        }}>
          <h3>❌ Gagal Memuat Data</h3>
          <p>Tidak dapat terhubung ke server. Pastikan FastAPI berjalan di port 8001.</p>
          {error && <p style={{ fontSize: "13px", opacity: 0.8 }}>Error: {error}</p>}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "80px", padding: 20, background: colors.bg, minHeight: "100vh" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 10
      }}>
        <div>
          <h2 style={{ margin: "0 0 5px 0", color: colors.text }}>📆 Prediksi Bulanan</h2>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: "14px" }}>
            Analisis tren harga Solana dalam skala bulanan
          </p>
        </div>
        <div style={{
          padding: "6px 12px",
          background: "#e9d5ff",
          color: "#6b21a8",
          borderRadius: 6,
          fontSize: "13px",
          fontWeight: "500"
        }}>
          ✓ Data dimuat dari cache
        </div>
      </div>

      {/* Info Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 15,
        marginBottom: 25
      }}>
        <div style={{
          padding: 15,
          background: colors.warning,
          border: `1px solid ${colors.warningBorder}`,
          borderRadius: 8
        }}>
          <div style={{ fontSize: "13px", color: colors.warningText, fontWeight: "500" }}>
            📊 Data Historis
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: colors.warningText, marginTop: 5 }}>
            {data.history?.length || 0} hari
          </div>
        </div>

        <div style={{
          padding: 15,
          background: colors.info,
          border: `1px solid ${colors.infoBorder}`,
          borderRadius: 8
        }}>
          <div style={{ fontSize: "13px", color: colors.infoText, fontWeight: "500" }}>
            🔍 Data Evaluasi
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: colors.infoText, marginTop: 5 }}>
            {data.eval?.length || 0} hari
          </div>
        </div>

        <div style={{
          padding: 15,
          background: colors.success,
          border: `1px solid ${colors.successBorder}`,
          borderRadius: 8
        }}>
          <div style={{ fontSize: "13px", color: colors.successText, fontWeight: "500" }}>
            🔮 Prediksi Masa Depan
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: colors.successText, marginTop: 5 }}>
            {data.forecast?.length || 0} hari
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: colors.cardBg,
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 1px 3px ${colors.shadow}`
      }}>
        <PredictionChart
          history={data.history}
          evalPairs={data.eval}
          forecast={data.forecast}
        />
      </div>

      {/* Additional Info */}
      <div style={{
        marginTop: 20,
        padding: 15,
        background: colors.bgTertiary,
        borderRadius: 8,
        fontSize: "13px",
        color: colors.textSecondary
      }}>
        <div style={{ fontWeight: "500", marginBottom: 5, color: colors.text }}>📝 Catatan:</div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Data historis menunjukkan pergerakan harga aktual Solana</li>
          <li>Data evaluasi membandingkan prediksi model vs harga aktual</li>
          <li>Prediksi masa depan menunjukkan proyeksi harga 30 hari ke depan</li>
          <li>Model menggunakan CNN-BiLSTM dengan window 60 hari</li>
        </ul>
      </div>
    </div>
  );
}

export default MonthlyPrediction;