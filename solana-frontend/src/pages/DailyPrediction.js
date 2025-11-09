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
        setProgress("❌ Gagal memuat data!");
        setInitialLoading(false);
      });
  }, []);

  const lastDate = useMemo(() => {
    if (!data?.history?.length) return "";
    return data.history[data.history.length - 1].date;
  }, [data]);

  const handlePredictDate = async (dateStr) => {
    setLoading(true);
    setSinglePrediction(null);
    try {
      const res = await axios.get(`http://127.0.0.1:8001/predict_date?target_date=${dateStr}`);
      setSinglePrediction(res.data);
    } catch (e) {
      console.error(e);
      setSinglePrediction({ error: "Gagal memprediksi tanggal tersebut." });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        background: colors.bg,
        transform: "translateY(40px)"
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
            borderTop: `4px solid ${colors.primary}`,
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

  if (!data && !initialLoading) {
    return (
      <div style={{ paddingTop: "110px", padding: 20, background: colors.bg, minHeight: "100vh" }}>
        <div style={{
          padding: 20,
          background: colors.error,
          border: `1px solid ${colors.errorBorder}`,
          borderRadius: 8,
          color: colors.errorText
        }}>
          <h3>❌ Gagal Memuat Data</h3>
          <p>Tidak dapat terhubung ke server. Pastikan FastAPI berjalan di port 8001.</p>
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
          <h2 style={{ margin: "0 0 5px 0", color: colors.text }}>📅 Prediksi Harian</h2>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: "14px" }}>
            Analisis dan prediksi harga Solana per hari
          </p>
        </div>
        <div style={{
          padding: "6px 12px",
          background: colors.success,
          color: colors.successText,
          borderRadius: 6,
          fontSize: "13px",
          fontWeight: "500"
        }}>
          ✓ Data dimuat dari cache
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: colors.cardBg,
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 1px 3px ${colors.shadow}`,
        marginBottom: 30
      }}>
        <PredictionChart
          history={data.history}
          evalPairs={data.eval}
          forecast={data.forecast}
        />
      </div>

      {/* Form Section */}
      <div style={{
        background: colors.cardBg,
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 1px 3px ${colors.shadow}`
      }}>
        <h3 style={{ marginTop: 0, color: colors.text }}>🔮 Prediksi Berdasarkan Tanggal</h3>
        <p style={{ color: colors.textSecondary, marginBottom: 15 }}>
          Pilih tanggal maksimal 60 hari setelah data terakhir ({lastDate})
        </p>

        <PredictionForm
          minDate={lastDate}
          maxDays={60}
          loading={loading}
          onPredict={handlePredictDate}
        />

        {loading && (
          <div style={{
            marginTop: 16,
            padding: 15,
            border: `1px solid ${colors.infoBorder}`,
            borderRadius: 8,
            background: colors.info,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
            <div style={{
              width: 20,
              height: 20,
              border: `3px solid ${colors.infoBorder}`,
              borderTop: `3px solid ${colors.primary}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            <span style={{ color: colors.infoText }}>
              🔮 Menghitung prediksi...
            </span>
          </div>
        )}

        {singlePrediction && !singlePrediction.error && (
          <div style={{
            marginTop: 16,
            padding: 15,
            border: `1px solid ${colors.successBorder}`,
            borderRadius: 8,
            background: colors.success,
            maxWidth: 420,
            animation: "fadeIn 0.3s ease-in"
          }}>
            <h4 style={{ marginTop: 0, color: colors.successText }}>
              📊 Hasil Prediksi
            </h4>
            <p style={{ color: colors.successText }}>
              <b>Dari data terakhir:</b> {singlePrediction.last_date}
            </p>
            <p style={{ color: colors.successText }}>
              <b>Tanggal diprediksi:</b> {singlePrediction.target_date}
            </p>
            <p style={{ color: colors.successText }}>
              <b>Jarak hari:</b> {singlePrediction.days_ahead} hari
            </p>
            <p style={{ 
              fontSize: "18px", 
              fontWeight: "bold",
              color: colors.successText,
              marginBottom: 0
            }}>
              💰 Prediksi harga SOL: ${Number(singlePrediction.predicted_price).toFixed(2)}
            </p>
          </div>
        )}

        {singlePrediction?.error && (
          <div style={{
            marginTop: 16,
            padding: 15,
            border: `1px solid ${colors.errorBorder}`,
            borderRadius: 8,
            background: colors.error,
            color: colors.errorText
          }}>
            ❌ {singlePrediction.error}
          </div>
        )}
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
        <div style={{ fontWeight: "500", marginBottom: 5, color: colors.text }}>
          📝 Catatan:
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Pilih tanggal untuk melihat prediksi harga Solana</li>
          <li>Prediksi menggunakan model CNN-BiLSTM dengan window 60 hari</li>
          <li>Akurasi prediksi lebih tinggi untuk tanggal yang lebih dekat</li>
          <li>Grafik di atas menunjukkan tren historis dan proyeksi 30 hari</li>
        </ul>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default DailyPrediction;