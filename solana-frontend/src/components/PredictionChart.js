import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// Helper: merge arrays by date
function mergeByDate({ history = [], evalPairs = [], forecast = [] }) {
  const map = new Map();

  // eval: actual & predicted
  evalPairs.forEach(({ date, actual, predicted }) => {
    if (!map.has(date)) map.set(date, { date });
    const row = map.get(date);
    row.actual = actual;
    row.predicted = predicted;
  });

  // forecast
  forecast.forEach(({ date, price }) => {
    if (!map.has(date)) map.set(date, { date });
    map.get(date).price_forecast = price;
  });

  // sort ascending
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function PredictionChart({ history, evalPairs, forecast, predictionType = "monthly" }) {
  const data = useMemo(() => {
    const merged = mergeByDate({ history, evalPairs, forecast });

    // --- Ambil 15 hari actual + predicted terakhir ---
    const evalOnly = merged.filter(r => r.actual !== undefined || r.predicted !== undefined);
    const lastEval = evalOnly.slice(-15);

    // --- Ambil 10 hari forecast ---
    const forecastOnly = merged.filter(r => r.price_forecast !== undefined);
    const next10 = forecastOnly.slice(0, 10);

    // Gabungkan → total sekitar 25 hari
    const finalData = [...lastEval, ...next10];

    return finalData;
  }, [history, evalPairs, forecast]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="top"
          wrapperStyle={{ paddingLeft: "10px", paddingTop: "10px", fontSize: "13px" }}
        />

        {/* Actual */}
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual (Eval)"
          stroke="#1f77b4"
          strokeWidth={2.2}
          dot={false}
        />

        {/* Predicted */}
        <Line
          type="monotone"
          dataKey="predicted"
          name="Predicted (Eval)"
          stroke="#2ca02c"
          strokeWidth={2.2}
          dot={false}
        />

        {/* Forecast 10 hari */}
        <Line
          type="monotone"
          dataKey="price_forecast"
          name="Forecast (Next 10d)"
          stroke="#ff7f0e"
          strokeWidth={2.2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PredictionChart;