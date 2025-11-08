import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
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

// =============================
// AdminPage — SOL Forecast Eval
// =============================
// Fetches eval/history/forecast from FastAPI `/forecast`,
// computes RMSE (USD + %) and MAPE (%), and shows evaluation + forecast.

const FAST_API_URL =
  (import.meta && import.meta.env && import.meta.env.VITE_SOL_API_URL) ||
  process.env.REACT_APP_SOL_API_URL ||
  "http://localhost:8001";

const currency = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    v
  );

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
      .catch((err) => setError(err.message || String(err)))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return { ...data, loading, error };
}

function computeMetrics(pairs) {
  if (!pairs || pairs.length === 0) return { rmseUsd: 0, rmsePct: 0, mape: 0 };
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

  return { rmseUsd, rmsePct, mape };
}

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-2xl shadow p-4 bg-white/70 border">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
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
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={20} />
          <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip formatter={(v) => currency(Number(v))} />
          <Legend />
          <Line type="monotone" dataKey="Actual" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Predicted" dot={false} strokeWidth={2} />
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
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={20} />
          <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip formatter={(v) => currency(Number(v))} />
          <Legend />
          <Line type="monotone" dataKey="Price" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";

  const { eval: evalData, forecast, loading, error } = useForecastData();
  const metrics = useMemo(() => computeMetrics(evalData), [evalData]);
  const lastEvalDate = useMemo(
    () => (evalData.length ? evalData[evalData.length - 1].date : "-"),
    [evalData]
  );

  if (role !== "admin") {
    return (
      <DashboardLayout role={role}>
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Unauthorized</h1>
          <p className="mt-2 text-gray-600">Halaman ini khusus Admin.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">⚙️ Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Model Evaluation & 30-Day Forecast</p>
          </div>
          <div className="text-sm text-gray-500">
            <div>API: <code>{FAST_API_URL}</code></div>
            <div>Last Eval Date: <b>{lastEvalDate}</b></div>
          </div>
        </div>

        {loading && (
          <div className="animate-pulse p-6 rounded-2xl border bg-white/60">Loading evaluation…</div>
        )}
        {error && (
          <div className="p-4 rounded-2xl border bg-rose-50 text-rose-700">
            Gagal memuat data dari FastAPI: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Kpi label="RMSE (USD)" value={currency(metrics.rmseUsd)} hint="Root Mean Square Error" />
              <Kpi label="RMSE (%)" value={`${metrics.rmsePct.toFixed(2)}%`} />
              <Kpi label="MAPE (%)" value={`${metrics.mape.toFixed(2)}%`} />
            </div>

            {/* Evaluation Chart */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Evaluation — Actual vs Predicted (last 60 days)</h2>
              <EvalChart evalData={evalData} />
            </section>

            {/* Forecast Chart */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">30-Day Forecast</h2>
              <ForecastChart forecast={forecast} />
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}