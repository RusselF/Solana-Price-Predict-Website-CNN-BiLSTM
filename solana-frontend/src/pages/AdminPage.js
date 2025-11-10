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

// Format currency helper
const currency = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);

// Fetch forecast data from FastAPI
function useForecastData() {
  const [data, setData] = useState({
    eval: [],
    forecast: [],
    history: [],
    train_loss: [],
    val_loss: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetch(`${FAST_API_URL}/forecast`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) setData(json);
      })
      .catch((err) => {
        if (mounted) setError(err.message || String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { ...data, loading, error };
}

// Compute RMSE, MAPE, etc.
function computeMetrics(pairs) {
  if (!pairs || pairs.length === 0) {
    return { rmseUsd: 0, rmsePct: 0, mape: 0, count: 0 };
  }

  let se = 0;
  let apeSum = 0;
  let count = 0;
  let actSum = 0;

  for (const row of pairs) {
    const a = Number(row.actual);
    const p = Number(row.predicted);
    const diff = p - a;
    se += diff * diff;
    actSum += a;
    if (a !== 0) {
      apeSum += Math.abs(diff / a);
      count++;
    }
  }

  const n = pairs.length;
  const rmseUsd = Math.sqrt(se / n);
  const avgAct = actSum / n;
  const rmsePct = avgAct !== 0 ? (rmseUsd / avgAct) * 100 : 0;
  const mape = count > 0 ? (apeSum / count) * 100 : 0;

  return { rmseUsd, rmsePct, mape, count: n };
}

// KPI component
function Kpi({ label, value, hint, icon }) {
  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-100 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
          {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
        </div>
        {icon && <div className="text-3xl opacity-20">{icon}</div>}
      </div>
    </div>
  );
}

// Chart components
function EvalChart({ evalData }) {
  const chartData = useMemo(
    () =>
      evalData.map((d) => ({
        date: d.date,
        Actual: Number(d.actual),
        Predicted: Number(d.predicted),
      })),
    [evalData]
  );

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => currency(v)} />
          <Legend />
          <Line type="monotone" dataKey="Actual" stroke="#10b981" dot={false} />
          <Line type="monotone" dataKey="Predicted" stroke="#3b82f6" strokeDasharray="5 5" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ForecastChart({ forecast }) {
  const chartData = useMemo(
    () => forecast.map((d) => ({ date: d.date, Price: Number(d.price) })),
    [forecast]
  );

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => currency(v)} />
          <Legend />
          <Line type="monotone" dataKey="Price" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function LossChart() {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <img
        src={trainLossImage}
        alt="Training and Validation Loss Chart"
        className="rounded-xl shadow-md border border-gray-100 max-w-full h-auto dark:border-gray-700"
      />
      <p className="text-gray-500 text-sm mt-3 dark:text-gray-400">
        Figure: Model Training & Validation Loss Curve
      </p>
    </div>
  );
}

function ForecastTable({ forecast }) {
  return (
    <div className="overflow-x-auto mt-4 border rounded-lg dark:border-gray-700">
      <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
        <thead className="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-right">Predicted Price (USD)</th>
          </tr>
        </thead>
        <tbody>
          {forecast.map((row, i) => (
            <tr key={i} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-2">{row.date}</td>
              <td className="px-4 py-2 text-right">{currency(row.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/login");
  }, [user, navigate]);

  const { eval: evalData, forecast, loading, error } = useForecastData();
  const metrics = useMemo(() => computeMetrics(evalData), [evalData]);
  const lastEvalDate = useMemo(
    () => (evalData.length ? evalData[evalData.length - 1].date : "-"),
    [evalData]
  );

  if (!user || user.role !== "admin") return null;

  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-gray-50";
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900";

  return (
    <div className={`min-h-screen ${bgColor} pt-20 pb-8 transition-colors duration-300`}>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Model Documentation</h1>
              <p className="text-purple-100 text-lg">
                Evaluation Metrics & Forecast Visualization
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm">
              <div className="opacity-80">FastAPI Endpoint</div>
              <code className="font-mono text-xs">{FAST_API_URL}</code>
              <div className="mt-2 opacity-80">Last Evaluation</div>
              <div className="font-semibold">{lastEvalDate}</div>
            </div>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-10 animate-pulse text-gray-500 dark:text-gray-400">
            Loading data...
          </div>
        )}
        {error && (
          <div className="p-6 rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-900/40">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi label="RMSE (USD)" value={currency(metrics.rmseUsd)} hint="Error in USD" icon="💵" />
              <Kpi label="RMSE (%)" value={`${metrics.rmsePct.toFixed(2)}%`} hint="Relative Error" icon="📊" />
              <Kpi label="MAPE" value={`${metrics.mape.toFixed(2)}%`} hint="Mean % Error" icon="🎯" />
              <Kpi label="Eval Points" value={metrics.count} hint="Data Samples" icon="📈" />
            </div>

            {/* Training & Validation Loss Chart */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-3">Training & Validation Loss</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Learning curve of model per epoch
              </p>
              <LossChart />
            </section>

            {/* Evaluation Chart */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-3">Model Performance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Actual vs Predicted on test data
              </p>
              <EvalChart evalData={evalData} />
            </section>

            {/* Forecast Chart + Table */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-3">30-Day Forecast</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Predicted prices based on last 60 days
              </p>
              <ForecastChart forecast={forecast} />
              <ForecastTable forecast={forecast} />
            </section>
          </>
        )}
      </div>

      {/* Floating theme toggle button */}
      <ThemeToggle />
    </div>
  );
}