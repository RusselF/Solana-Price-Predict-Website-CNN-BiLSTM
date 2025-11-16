import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import PredictionChart from "../components/PredictionChart";
import PredictionForm from "../components/PredictionForm";
import { useTheme } from "../context/ThemeContext";

function DailyPrediction() {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [singlePrediction, setSinglePrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState("Memuat data...");

  // ============================================================
  // LOAD DATA DARI API
  // ============================================================
  useEffect(() => {
    setProgress("🔄 Mengambil data dari API...");
    setInitialLoading(true);

    axios
      .get("http://127.0.0.1:8001/forecast")
      .then((res) => {
        setProgress("✅ Memproses data...");
        setTimeout(() => {
          setData(res.data);
          setInitialLoading(false);
        }, 300);
      })
      .catch((err) => {
        console.error(err);
        setProgress("❌ Gagal memuat data!");
        setInitialLoading(false);
      });
  }, []);

  // AMBIL TANGGAL TERAKHIR DATA
  const lastDate = useMemo(() => {
    if (!data?.history?.length) return "";
    return data.history[data.history.length - 1].date;
  }, [data]);

  // REQUEST PREDIKSI TANGGAL
  const handlePredictDate = async (dateStr) => {
    setLoading(true);
    setSinglePrediction(null);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8001/predict_date?target_date=${dateStr}`
      );
      setSinglePrediction(res.data);
    } catch (err) {
      console.error(err);
      setSinglePrediction({ error: "Gagal memprediksi tanggal tersebut." });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================
  if (initialLoading) {
    return (
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          background: colors.bg,
          transform: "translateY(40px)",
        }}
      >
        <div
          style={{
            padding: 30,
            border: `2px solid ${colors.border}`,
            borderRadius: 12,
            background: colors.bgSecondary,
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              border: `4px solid ${colors.border}`,
              borderTop: `4px solid ${colors.primary}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          />

          <h2 style={{ margin: "0 0 10px 0", color: colors.text }}>
            ⏳ Memuat Data
          </h2>
          <p style={{ color: colors.textSecondary, margin: 0 }}>{progress}</p>
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

  // ============================================================
  // ERROR LOAD
  // ============================================================
  if (!data && !initialLoading) {
    return (
      <div
        style={{
          paddingTop: "110px",
          padding: 20,
          background: colors.bg,
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            padding: 20,
            background: colors.error,
            border: `1px solid ${colors.errorBorder}`,
            borderRadius: 8,
            color: colors.errorText,
          }}
        >
          <h3>❌ Gagal Memuat Data</h3>
          <p>Tidak dapat terhubung ke server. Pastikan FastAPI berjalan.</p>

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
              fontWeight: "500",
            }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================
  return (
    <div style={{ paddingTop: "80px", padding: 20, background: colors.bg }}>
      
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <p style={{ margin: "0 0 5px 0", color: colors.text, fontSize: "36px", fontWeight: "800" }}>📆 Prediksi Harian</p>
          <p style={{ margin: 0, color: colors.textSecondary,fontSize: "18px" }}>
            Analisis dan prediksi harga Solana per hari
          </p>
        </div>

        <div
          style={{
            padding: "6px 12px",
            background: colors.success,
            color: colors.successText,
            borderRadius: 6,
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          ✓ Data dimuat dari cache
        </div>
      </div>

      {/* ================================================================= */}
      {/* CHART + FORM KANAN */}
      {/* ================================================================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "nowrap",
        }}
      >
        {/* === CHART KIRI === */}
        <div
          style={{
            background: colors.cardBg,
            padding: 20,
            borderRadius: 12,
            border: `1px solid ${colors.cardBorder}`,
            maxWidth: "900px",
            width: "900px",
            minHeight: "355px",
          }}
        >
          <PredictionChart
            history={data.history}
            evalPairs={data.eval}
            forecast={data.forecast}
          />
        </div>

        {/* === FORM KANAN === */}
        <div
          style={{
            background: colors.cardBg,
            padding: 20,
            borderRadius: 12,
            border: `1px solid ${colors.cardBorder}`,
            width: "340px",
            height: "100%",
            maxHeight: "365px",     
            overflowY: "auto",           
            boxSizing: "border-box",
          }}
        >
          <h3 style={{ marginTop: 0, color: colors.text }}>
            🔮 Prediksi Berdasarkan Tanggal
          </h3>

          <p style={{ color: colors.textSecondary }}>
            Pilih tanggal maksimal 60 hari setelah data terakhir: <br />
            <b>{lastDate}</b>
          </p>

          <PredictionForm
            minDate={lastDate}
            maxDays={60}
            loading={loading}
            onPredict={handlePredictDate}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* PANEL HASIL PREDIKSI (DI BAWAH, FULL WIDTH) */}
      {/* ================================================================= */}

      <div
        style={{
          marginTop: "25px",
          padding: 20,
          background: colors.cardBg,
          borderRadius: 12,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        {singlePrediction ? (
          singlePrediction.error ? (
            <div
              style={{
                padding: 15,
                background: colors.error,
                border: `1px solid ${colors.errorBorder}`,
                borderRadius: 8,
                color: colors.errorText,
              }}
            >
              ❌ {singlePrediction.error}
            </div>
          ) : (
            <div
              style={{
                padding: 15,
                background: colors.success,
                borderRadius: 8,
                border: `1px solid ${colors.successBorder}`,
                color: colors.successText,
              }}
            >
              <h3 style={{ marginTop: 0 }}>📊 Hasil Prediksi</h3>

              <p>
                <b>Dari data terakhir:</b> {singlePrediction.last_date}
              </p>

              <p>
                <b>Tanggal diprediksi:</b> {singlePrediction.target_date}
              </p>

              <p>
                <b>Jarak hari:</b> {singlePrediction.days_ahead} hari
              </p>

              <p
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  marginTop: 12,
                }}
              >
                💰 Prediksi harga SOL: $
                {Number(singlePrediction.predicted_price).toFixed(2)}
              </p>
            </div>
          )
        ) : (
          <p style={{ color: colors.textSecondary }}>Belum ada prediksi.</p>
        )}
      </div>
    </div>
  );
}

export default DailyPrediction;