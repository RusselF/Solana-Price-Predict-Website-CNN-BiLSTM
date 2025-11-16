import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import trainLossImage from "../assets/trainloss.png";

const FAST_API_URL = "http://localhost:8001";

// Currency helper
const currency = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

// ============================
// FETCH FORECAST DATA
// ============================
function useForecastData() {
  const [data, setData] = useState({
    eval: [],
    forecast: [],
    history: [],
    summary: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${FAST_API_URL}/forecast`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
}

// ============================
// KPI METRICS
// ============================
function computeMetrics(evalData) {
  if (!evalData || evalData.length === 0)
    return { rmseUsd: 0, rmsePct: 0, mape: 0 };

  let se = 0;
  let apeSum = 0;
  let actSum = 0;

  for (const row of evalData) {
    const a = Number(row.actual);
    const p = Number(row.predicted);
    const diff = p - a;
    se += diff * diff;
    actSum += a;
    if (a !== 0) apeSum += Math.abs(diff / a);
  }

  const n = evalData.length;
  const rmseUsd = Math.sqrt(se / n);
  const avgAct = actSum / n;
  const rmsePct = (rmseUsd / avgAct) * 100;
  const mape = (apeSum / n) * 100;

  return { rmseUsd, rmsePct, mape };
}

// ============================
// KPI Component
// ============================
function Kpi({ label, value, hint, icon }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-50">{value}</p>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
        <div className="text-4xl opacity-25">{icon}</div>
      </div>
    </div>
  );
}

// ============================
// CHARTS
// ============================
function EvalChart({ evalData }) {
  const data = evalData.map((d) => ({
    date: d.date,
    Actual: Number(d.actual),
    Predicted: Number(d.predicted),
  }));

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(v) => currency(v)} />
          <Legend />

          <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={3} dot={false} />
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#3b82f6"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ForecastChart({ forecast }) {
  const data = forecast.map((d) => ({
    date: d.date,
    Price: Number(d.price),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(v) => currency(v)} />
          <Legend />
          <Line type="monotone" dataKey="Price" stroke="#8b5cf6" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================
// ADMIN PAGE (MAIN)
// ============================
export default function AdminPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const { eval: evalData, forecast, history, loading } = useForecastData();
  const metrics = computeMetrics(evalData);

  const lastEvalDate = evalData.length ? evalData.at(-1).date : "-";

  if (!user || user.role !== "admin") return null;

  return (
    <div className={`min-h-screen pt-20 pb-16 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto px-6 space-y-10">

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}
        <header className="bg-gradient-to-r from-purple-600 to-blue-600 p-10 rounded-3xl shadow-lg text-white">
          <h1 className="text-4xl font-bold">📊 Model Documentation</h1>
          <p className="text-purple-100 text-lg">Evaluation Metrics & Forecast Visualization</p>
          <p className="mt-2 text-md">Last Evaluation: <b>{lastEvalDate}</b></p>
        </header>

        {loading ? (
          <p className="text-center py-10">Loading...</p>
        ) : (
          <>
            {/* ========================= */}
            {/* 1. KPI METRICS */}
            {/* ========================= */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Model KPI Metrics</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Kpi label="RMSE (USD)" value={currency(metrics.rmseUsd)} hint="Error in USD" icon="💵" />
                <Kpi label="RMSE (%)" value={`${metrics.rmsePct.toFixed(2)}%`} hint="Relative Error" icon="📊" />
                <Kpi label="MAPE" value={`${metrics.mape.toFixed(2)}%`} hint="Mean % Error" icon="🎯" />
              </div>
            </section>

            {/* ========================= */}
            {/* 2. DATASET OVERVIEW */}
            {/* ========================= */}
            <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Dataset Overview (Last 5 Entries)</h2>

              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="py-3 px-3 text-left">Date</th>
                    <th className="py-3 px-3 text-right">Close Price</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-5).map((row, i) => (
                    <tr key={i} className="border-b dark:border-gray-700">
                      <td className="py-2 px-3">{row.date}</td>
                      <td className="py-2 px-3 text-right">{currency(row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* ========================= */}
            {/* 3. MODEL SUMMARY */}
            {/* ========================= */}
            <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Model Summary</h2>

              <pre className="bg-gray-900 text-green-400 text-xs p-6 rounded-xl overflow-auto shadow-inner">
{`
Layer (type)                Output Shape        Param #
--------------------------------------------------------
conv1 (Conv1D)              (None, 60, 128)     512
pool1 (MaxPooling1D)        (None, 30, 128)     0
bilstm_1 (Bidirectional)    (None, 30, 300)     334,800
dropout                     (None, 30, 300)     0
bilstm_2 (Bidirectional)    (None, 100)         140,400
dense_64 (Dense)            (None, 64)          6,464
dense_32 (Dense)            (None, 32)          2,080
out (Dense)                 (None, 1)           33
--------------------------------------------------------
Total params: 484,289
Trainable params: 484,289
Non-trainable params: 0
`}
              </pre>
            </section>

            {/* ========================= */}
            {/* 4. LOSS CURVE */}
            {/* ========================= */}
            <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Training & Validation Loss</h2>
              <img src={trainLossImage} className="rounded-xl shadow-md" alt="Train Loss Chart" />
            </section>

            {/* ========================= */}
            {/* 5. FORECAST */}
            {/* ========================= */}
            <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4">30-Day Forecast</h2>
              <ForecastChart forecast={forecast} />

              <h3 className="text-xl font-semibold mt-6 mb-3">Forecast Table</h3>

              <div className="overflow-x-auto border rounded-xl">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-right">Predicted Price (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((row, i) => (
                      <tr key={i} className="border-b dark:border-gray-700">
                        <td className="px-4 py-2">{row.date}</td>
                        <td className="px-4 py-2 text-right">{currency(row.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      <ThemeToggle />
    </div>
  );
}