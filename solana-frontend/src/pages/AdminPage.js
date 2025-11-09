import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const FAST_API_URL = "http://localhost:8001";

const currency = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);

function useForecastData() {
  const [data, setData] = useState({ eval: [], history: [], forecast: [] });
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

function Kpi({ label, value, hint, icon }) {
  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
          {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
        </div>
        {icon && <div className="text-3xl opacity-20">{icon}</div>}
      </div>
    </div>
  );
}

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
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={30} stroke="#999" />
          <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} stroke="#999" />
          <Tooltip formatter={(v) => currency(Number(v))} />
          <Legend />
          <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
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
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} stroke="#999" />
          <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} stroke="#999" />
          <Tooltip formatter={(v) => currency(Number(v))} />
          <Legend />
          <Line type="monotone" dataKey="Price" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  const { eval: evalData, forecast, loading, error } = useForecastData();
  const metrics = useMemo(() => computeMetrics(evalData), [evalData]);
  const lastEvalDate = useMemo(
    () => (evalData.length ? evalData[evalData.length - 1].date : "-"),
    [evalData]
  );

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Model Documentation</h1>
              <p className="text-purple-100 text-lg">
                Evaluation Metrics & 30-Day Forecast
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

        {/* Loading */}
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6 rounded-xl border-2 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-red-900">
                  Failed to load evaluation data
                </div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi
                label="RMSE (USD)"
                value={currency(metrics.rmseUsd)}
                hint="Root Mean Square Error"
                icon="💵"
              />
              <Kpi
                label="RMSE (%)"
                value={`${metrics.rmsePct.toFixed(2)}%`}
                hint="Relative to mean price"
                icon="📊"
              />
              <Kpi label="MAPE" value={`${metrics.mape.toFixed(2)}%`} hint="Mean Absolute % Error" icon="🎯" />
              <Kpi label="Eval Points" value={metrics.count} hint="Number of test samples" icon="📈" />
            </div>

            {/* Evaluation Chart */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Model Performance</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Actual vs Predicted prices over the last 60 days
                </p>
              </div>
              <EvalChart evalData={evalData} />
            </section>

            {/* Forecast Chart */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">30-Day Price Forecast</h2>
                <p className="text-gray-500 text-sm mt-1">
                  AI-powered prediction for the next month
                </p>
              </div>
              <ForecastChart forecast={forecast} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}