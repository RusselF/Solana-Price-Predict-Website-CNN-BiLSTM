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

function PredictionChart({ history, evalPairs, forecast }) {
  const data = useMemo(() => mergeByDate({ history, evalPairs, forecast }), [history, evalPairs, forecast]);

  return (
    <ResponsiveContainer width="100%" height={420}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />

        {/* Context: actual history (tipis) */}
        <Line
          type="monotone"
          dataKey="price_history"
          name="Actual (History)"
          stroke="#999999"
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={false}
        />

        {/* Main comparison: Actual vs Predicted (paired) */}
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual (Eval)"
          stroke="#1f77b4"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          name="Predicted (Eval)"
          stroke="#2ca02c"
          dot={false}
        />

        {/* Context: predicted 30-days ahead (putus-putus) */}
        <Line
          type="monotone"
          dataKey="price_forecast"
          name="Forecast (Next 30d)"
          stroke="#ff7f0e"
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PredictionChart;
