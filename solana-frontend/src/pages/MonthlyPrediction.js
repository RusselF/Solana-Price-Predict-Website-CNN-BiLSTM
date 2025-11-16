import React, { useEffect, useState } from "react";
import axios from "axios";
import PredictionChart from "../components/PredictionChart";
import { useTheme } from "../context/ThemeContext";
import * as XLSX from "xlsx";

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
          // Ambil 30-60 hari terakhir dari history sebagai context
          const fullHistory = res.data.history || [];
          const contextHistory = fullHistory.slice(-60); // 60 hari terakhir
          
          // Untuk eval, ambil 30 hari terakhir saja (overlap dengan window)
          const fullEval = res.data.eval || [];
          const contextEval = fullEval.slice(-30); // 30 hari terakhir
          
          setData({
            ...res.data,
            history: contextHistory,
            eval: contextEval
          });
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

  // Calculate statistics for forecast
  const forecastData = data.forecast || [];
  const prices = forecastData.map(f => f.price);
  const avgPrice = prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices).toFixed(2) : 0;

    // fungsi CSV
  const handleDownloadExcel = () => {
    if (!forecastData.length) return;

    // Siapkan data untuk Excel
    const rows = forecastData.map((item, index) => {
      const prevPrice = index > 0 ? forecastData[index - 1].price : null;
      const change = prevPrice ? ((item.price - prevPrice) / prevPrice * 100).toFixed(2) : "-";
      return {
        No: index + 1,
        Tanggal: item.date,
        "Harga Prediksi (USD)": `$${item.price.toFixed(2)}`,
        "Perubahan (%)": change === "-" ? "-" : `${parseFloat(change) > 0 ? "↑" : "↓"} ${Math.abs(change)}%`,
      };
    });

    // Tambahkan summary
    const prices = forecastData.map(f => f.price);
    const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
    const min = Math.min(...prices).toFixed(2);
    const max = Math.max(...prices).toFixed(2);
    rows.push({});
    rows.push({ Tanggal: "Rata-rata", "Harga Prediksi (USD)": `$${avg}` });
    rows.push({ Tanggal: "Tertinggi", "Harga Prediksi (USD)": `$${max}` });
    rows.push({ Tanggal: "Terendah", "Harga Prediksi (USD)": `$${min}` });

    // Buat worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Atur lebar kolom otomatis
    const colWidths = [
      { wch: 5 },  // No
      { wch: 15 }, // Tanggal
      { wch: 20 }, // Harga Prediksi
      { wch: 15 }, // Perubahan
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Forecast 30 Hari");

    // Ekspor file .xlsx
    XLSX.writeFile(workbook, "forecast_30days.xlsx");
  };

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
          <p style={{ margin: "0 0 5px 0", color: colors.text, fontSize: "36px", fontWeight: "800" }}>📆 Prediksi Bulanan</p>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: "18px" }}>
            Prediksi 30 hari ke depan berdasarkan window 60 hari
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
          <div style={{ fontSize: "20px", color: colors.warningText, fontWeight: "500" }}>
            Window Historis
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: colors.warningText, marginTop: 5 }}>
            {data.history?.length || 0} hari
          </div>
          <div style={{ fontSize: "16px", color: colors.warningText, marginTop: 3, opacity: 0.8 }}>
            (30-60 hari terakhir)
          </div>
        </div>

        <div style={{
          padding: 15,
          background: colors.info,
          border: `1px solid ${colors.infoBorder}`,
          borderRadius: 8
        }}>
          <div style={{ fontSize: "20px", color: colors.infoText, fontWeight: "500" }}>
            Data Evaluasi
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: colors.infoText, marginTop: 5 }}>
            {data.eval?.length || 0} hari
          </div>
          <div style={{ fontSize: "16px", color: colors.infoText, marginTop: 3, opacity: 0.8 }}>
            (30 hari terakhir)
          </div>
        </div>

        <div style={{
          padding: 15,
          background: colors.success,
          border: `1px solid ${colors.successBorder}`,
          borderRadius: 8
        }}>
          <div style={{ fontSize: "20px", color: colors.successText, fontWeight: "500" }}>
            Prediksi Masa Depan
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: colors.successText, marginTop: 5 }}>
            {data.forecast?.length || 0} hari
          </div>
          <div style={{ fontSize: "16px", color: colors.successText, marginTop: 3, opacity: 0.8 }}>
            (30 hari ke depan)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: colors.cardBg,
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 1px 3px ${colors.shadow}`,
        marginBottom: 25
      }}>
        <PredictionChart
          history={data.history}
          evalPairs={data.eval}
          forecast={data.forecast}
          predictionType="monthly"
        />
      </div>

      {/* Forecast Statistics */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 15,
        marginBottom: 25
      }}>
        <div style={{
          padding: 15,
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 8,
          textAlign: "center"
        }}>
          <div style={{ fontSize: "20px", color: colors.textSecondary, fontWeight: "500" }}>
            Harga Rata-rata
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: colors.purple, marginTop: 5 }}>
            ${avgPrice}
          </div>
        </div>

        <div style={{
          padding: 15,
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 8,
          textAlign: "center"
        }}>
          <div style={{ fontSize: "20px", color: colors.textSecondary, fontWeight: "500" }}>
            Harga Terendah
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc2626", marginTop: 5 }}>
            ${minPrice}
          </div>
        </div>

        <div style={{
          padding: 15,
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 8,
          textAlign: "center"
        }}>
          <div style={{ fontSize: "20px", color: colors.textSecondary, fontWeight: "500" }}>
            Harga Tertinggi
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#16a34a", marginTop: 5 }}>
            ${maxPrice}
          </div>
        </div>
      </div>


      {/* 🔽 Tombol Download CSV */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15
      }}>
        <button
          onClick={handleDownloadExcel}
          style={{
            padding: "8px 16px",
            background: colors.purple,
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "500",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#6b21a8"}
          onMouseLeave={(e) => e.currentTarget.style.background = colors.purple}
        >
          ⬇️ Download CSV
        </button>
      </div>
      
      {/* WRAPPER TABEL + INFO DI KANAN */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: "35px",                // jarak kiri-kanan
          marginTop: "20px",
          width: "100%",
        }}
      >

        {/* =========================
            TABEL KIRI
        ========================== */}
        <div style={{ flex: 1, maxWidth: "900px" }}>
          <div
            style={{
              background: colors.cardBg,
              padding: 20,
              borderRadius: 12,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 1px 3px ${colors.shadow}`,
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                color: colors.text,
                fontSize: "18px",
              }}
            >
              Tabel Prediksi 30 Hari Ke Depan
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ background: colors.bgSecondary }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        color: colors.text,
                        fontWeight: 600,
                        borderBottom: `2px solid ${colors.border}`,
                      }}
                    >
                      No
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        color: colors.text,
                        fontWeight: 600,
                        borderBottom: `2px solid ${colors.border}`,
                      }}
                    >
                      Tanggal
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: colors.text,
                        fontWeight: 600,
                        borderBottom: `2px solid ${colors.border}`,
                      }}
                    >
                      Harga Prediksi (USD)
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: colors.text,
                        fontWeight: 600,
                        borderBottom: `2px solid ${colors.border}`,
                      }}
                    >
                      Perubahan
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {forecastData.map((item, index) => {
                    const prevPrice =
                      index > 0 ? forecastData[index - 1].price : null;
                    const change = prevPrice
                      ? ((item.price - prevPrice) / prevPrice * 100).toFixed(2)
                      : null;

                    const isPositive = change && parseFloat(change) > 0;
                    const isNegative = change && parseFloat(change) < 0;

                    return (
                      <tr
                        key={index}
                        style={{
                          background:
                            index % 2 === 0
                              ? colors.cardBg
                              : colors.bgSecondary,
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            colors.bgTertiary)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            index % 2 === 0
                              ? colors.cardBg
                              : colors.bgSecondary)
                        }
                      >
                        <td
                          style={{
                            padding: "12px",
                            color: colors.textSecondary,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {index + 1}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            color: colors.text,
                            fontWeight: 500,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {item.date}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            color: colors.purple,
                            fontWeight: 600,
                            fontSize: "15px",
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          ${item.price.toFixed(2)}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {change ? (
                            <span
                              style={{
                                color: isPositive
                                  ? "#16a34a"
                                  : isNegative
                                  ? "#dc2626"
                                  : colors.textSecondary,
                                fontWeight: 500,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {isPositive
                                ? "↑"
                                : isNegative
                                ? "↓"
                                : "→"}{" "}
                              {Math.abs(parseFloat(change))}%
                            </span>
                          ) : (
                            <span style={{ color: colors.textSecondary }}>
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =========================
            PANEL INFO KANAN
        ========================== */}
        <div style={{ width: "560px", flexShrink: 0 }}>
          
          {/* Box Cara Kerja */}
          <div
            style={{
              padding: 15,
              background: colors.bgTertiary,
              borderRadius: 8,
              fontSize: "20px",
              color: colors.textSecondary,
              marginBottom: 15,
            }}
          >
            <div
              style={{
                fontWeight: 500,
                marginBottom: 5,
                color: colors.text,
              }}
            >
              Cara Kerja Prediksi Bulanan:
            </div>

            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><b>Window 60 hari</b>: model membaca 60 hari historis</li>
              <li><b>30 hari evaluasi</b>: cek akurasi model</li>
              <li><b>30 hari prediksi</b>: proyeksi masa depan</li>
              <li><b>CNN-BiLSTM</b>: menangkap pola temporal</li>
            </ul>
          </div>

          {/* Box Perhatian */}
          <div
            style={{
              padding: 15,
              background: "#fef3c7",
              border: "1px solid #fbbf24",
              borderRadius: 8,
              fontSize: "20px",
              color: "#78350f",
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 5 }}>
              ⚠️ Perhatian:
            </div>
            <p style={{ margin: 0 }}>
              Prediksi ini berbasis pola historis dan bukan jaminan harga aktual.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default MonthlyPrediction;