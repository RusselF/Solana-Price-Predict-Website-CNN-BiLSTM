import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// Helper: merge arrays by date into one row per date
function mergeByDate({ history = [], evalPairs = [], forecast = [] }) {
  const map = new Map();

  // history: {date, price} => price_history
  history.forEach(({ date, price }) => {
    if (!map.has(date)) map.set(date, { date });
    map.get(date).price_history = price;
  });

  // eval: {date, actual, predicted}
  evalPairs.forEach(({ date, actual, predicted }) => {
    if (!map.has(date)) map.set(date, { date });
    const row = map.get(date);
    row.actual = actual;
    row.predicted = predicted;
  });

  // forecast: {date, price} => price_forecast
  forecast.forEach(({ date, price }) => {
    if (!map.has(date)) map.set(date, { date });
    map.get(date).price_forecast = price;
  });

  // sort by date ascending
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function PredictionChart({ history, evalPairs, forecast, predictionType = "monthly" }) {
  const data = useMemo(() => {
    const merged = mergeByDate({ history, evalPairs, forecast });
    
    // Jika daily prediction, batasi forecast hanya 1 hari
    if (predictionType === "daily") {
      // Cari index pertama yang punya price_forecast
      const firstForecastIndex = merged.findIndex(row => row.price_forecast !== undefined);
      
      if (firstForecastIndex !== -1) {
        // Hapus semua forecast setelah hari pertama
        merged.forEach((row, idx) => {
          if (idx > firstForecastIndex && row.price_forecast !== undefined) {
            delete row.price_forecast;
          }
        });
      }
    }
    
    return merged;
  }, [history, evalPairs, forecast, predictionType]);

  return (
    <ResponsiveContainer width="100%" height={420}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend 
          layout="vertical" 
          align="right" 
          verticalAlign="top"
          wrapperStyle={{
            paddingLeft: '10px',
            paddingTop: '10px'
          }}
        />

        {/* Context: actual history (lebih tebal) */}
        <Line
          type="monotone"
          dataKey="price_history"
          name="Actual (History)"
          stroke="#999999"
          strokeWidth={2.5}
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={false}
        />

        {/* Main comparison: Actual vs Predicted (tebal) */}
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual (Eval)"
          stroke="#1f77b4"
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          name="Predicted (Eval)"
          stroke="#2ca02c"
          strokeWidth={3}
          dot={false}
        />

        {/* Context: forecast (tebal, putus-putus) */}
        <Line
          type="monotone"
          dataKey="price_forecast"
          name={predictionType === "daily" ? "Forecast (Next Day)" : "Forecast (Next 30d)"}
          stroke="#ff7f0e"
          strokeWidth={3}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PredictionChart;