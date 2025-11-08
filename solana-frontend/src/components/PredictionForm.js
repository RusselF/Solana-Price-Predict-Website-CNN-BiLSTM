import React, { useState, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

function PredictionForm({ minDate, onPredict, loading = false }) {
  const { colors } = useTheme();
  const [date, setDate] = useState("");

  // maxDate = minDate + 1 hari (hanya bisa prediksi 1 hari ke depan)
  const maxDate = useMemo(() => {
    if (!minDate) return "";
    const d = new Date(minDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [minDate]);

  // minDateAllowed = minDate + 1 (tidak boleh sama dengan atau sebelum data terakhir)
  const minDateAllowed = useMemo(() => {
    if (!minDate) return "";
    const d = new Date(minDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [minDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date) return;
    onPredict(date);
  };

  return (
    <div>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          display: "flex", 
          gap: 12, 
          alignItems: "center", 
          marginBottom: 12,
          flexWrap: "wrap" 
        }}
      >
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={minDateAllowed}  // minimal = data terakhir + 1
          max={maxDate}          // maksimal = data terakhir + 1 (sama dengan min)
          style={{ 
            padding: "10px 12px", 
            border: `1px solid ${colors.border}`, 
            borderRadius: 6,
            fontSize: "14px",
            minWidth: "160px",
            background: colors.cardBg,
            color: colors.text
          }}
          required
        />
        <button
          type="submit"
          disabled={loading || !date}
          style={{ 
            padding: "10px 16px", 
            border: "none", 
            borderRadius: 6, 
            background: loading || !date ? "#9ca3af" : colors.primary, 
            color: "#fff", 
            cursor: loading || !date ? "not-allowed" : "pointer",
            fontWeight: "500",
            fontSize: "14px",
            transition: "all 0.2s"
          }}
        >
          {loading ? "⏳ Memproses..." : "🔮 Prediksi"}
        </button>
      </form>

      {/* Info text */}
      <div style={{ 
        padding: "10px 12px",
        background: colors.warning,
        border: `1px solid ${colors.warningBorder}`,
        borderRadius: 6,
        fontSize: "13px", 
        color: colors.warningText,
        marginBottom: 16
      }}>
        <div style={{ fontWeight: "500", marginBottom: 4 }}>
          💡 Batasan Prediksi
        </div>
        <div>
          Anda hanya dapat memprediksi <b>1 hari setelah data terakhir</b> ({minDate}), 
          yaitu tanggal <b>{maxDate}</b>. Ini karena model membutuhkan data historis 
          sampai hari sebelumnya untuk membuat prediksi.
        </div>
      </div>
    </div>
  );
}

export default PredictionForm;