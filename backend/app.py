from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import yfinance as yf
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf
import keras
from sklearn.preprocessing import MinMaxScaler
from typing import List, Dict, Tuple
from datetime import datetime
import time

# ==========================================================
# App & CORS
# ==========================================================
app = FastAPI(title="SOL Forecast API", version="1.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ==========================================================
# Konfigurasi (UNIVARIATE)
# ==========================================================
MODEL_PATH = "artifacts/sol_cnn_bilstm_univariate.keras"
SCALER_PATH = "artifacts/close_scaler.pkl"
FEATURES: List[str] = ["Close"]
TARGET: str = "Close"
WINDOW: int = 60

# ==========================================================
# Load Model & Scaler (sekali saja)
# ==========================================================
model = keras.models.load_model(
    MODEL_PATH,
    custom_objects={
        "MeanSquaredError": tf.keras.losses.MeanSquaredError,
        "MeanAbsoluteError": tf.keras.metrics.MeanAbsoluteError,
    }
)
scaler: MinMaxScaler = joblib.load(SCALER_PATH)

# ==========================================================
# Cache sederhana (in-memory)
# ==========================================================
# Cache harga: key = (symbol, period, interval) -> (df, ts)
_PRICE_CACHE: dict[Tuple[str, str, str], Tuple[pd.DataFrame, float]] = {}
PRICE_TTL_SEC = 300  # 5 menit; ubah ke 3600 untuk 1 jam

# Cache forecast: key = (period, interval) -> (payload_json, ts)
_FORECAST_CACHE: dict[Tuple[str, str], Tuple[dict, float]] = {}
FORECAST_TTL_SEC = 300

def get_prices_cached(symbol="SOL-USD", period="2y", interval="1d") -> pd.DataFrame:
    """Ambil harga dari cache; jika expired ambil dari yfinance."""
    key = (symbol, period, interval)
    now = time.time()
    if key in _PRICE_CACHE:
        df, ts = _PRICE_CACHE[key]
        if now - ts < PRICE_TTL_SEC:
            return df.copy()

    df = yf.download(
        symbol, period=period, interval=interval,
        auto_adjust=False, progress=False
    )
    df = df[["Close"]].dropna()
    _PRICE_CACHE[key] = (df, now)
    print(f"[Cache] Refetched {symbol} ({period}, {interval}) at {time.strftime('%H:%M:%S')}")
    return df.copy()

def inverse_target(scaled_1d, scaler: MinMaxScaler) -> np.ndarray:
    scaled_1d = np.array(scaled_1d).reshape(-1, 1)
    inv = scaler.inverse_transform(scaled_1d)
    return inv.ravel()

def forecast_recursive(model, series_scaled: np.ndarray, steps: int = 30) -> np.ndarray:
    buf = series_scaled.copy()
    preds_scaled: List[float] = []
    for _ in range(steps):
        x = buf[-WINDOW:, :].reshape(1, WINDOW, 1)
        y_hat_scaled = model.predict(x, verbose=0).squeeze()
        preds_scaled.append(float(y_hat_scaled))
        buf = np.vstack([buf, np.array([[y_hat_scaled]])])
    preds = inverse_target(preds_scaled, scaler)
    return preds

def backtest_predictions(
    model,
    series_scaled: np.ndarray,
    df_close: pd.Series,
    span: int = 60
) -> List[Dict]:
    N = series_scaled.shape[0]
    dates = df_close.index
    preds: List[float] = []
    acts: List[float] = []
    out_dates: List[pd.Timestamp] = []

    for i in range(WINDOW, N):
        x = series_scaled[i - WINDOW:i, :].reshape(1, WINDOW, 1)
        y_hat_scaled = model.predict(x, verbose=0).squeeze()
        y_hat = float(inverse_target([y_hat_scaled], scaler)[0])
        preds.append(y_hat)

        val = df_close.iloc[i]
        if hasattr(val, "item"):
            val = val.item()
        acts.append(float(val))
        out_dates.append(dates[i])

    if span is not None and span > 0:
        preds = preds[-span:]
        acts = acts[-span:]
        out_dates = out_dates[-span:]

    return [
        {"date": str(d.date()), "actual": a, "predicted": p}
        for d, a, p in zip(out_dates, acts, preds)
    ]

# ==========================================================
# Startup: warm cache (opsional)
# ==========================================================
@app.on_event("startup")
def warm_cache():
    try:
        # pre-load default (max, 1d) agar request pertama cepat
        _ = get_prices_cached("SOL-USD", "max", "1d")
        print("[Startup] Price cache preloaded.")
    except Exception as e:
        print("[Startup] Warm cache failed:", e)

# ==========================================================
# Routes
# ==========================================================
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/predict")
def predict(period: str = Query("2y", description="yfinance period, e.g., max, 2y, 1y, 6mo")):
    """
    Prediksi next day berdasarkan window terakhir.
    period default 'max' (riwayat penuh), bisa diganti '2y' untuk lebih cepat.
    """
    df = get_prices_cached("SOL-USD", period, "1d")
    series_scaled = scaler.transform(df[["Close"]].values)
    x = series_scaled[-WINDOW:, :].reshape(1, WINDOW, 1)
    y_hat_scaled = model.predict(x, verbose=0).squeeze()
    next_day = float(inverse_target([y_hat_scaled], scaler)[0])

    last_close = float(df["Close"].iloc[-1])
    last_date = str(df.index[-1].date())

    payload = {
        "date": last_date,
        "last_close": last_close,
        "pred_next_day": next_day
    }
    return JSONResponse(payload, headers={"Cache-Control": "public, max-age=300"})

@app.get("/predict_date")
def predict_date(
    target_date: str,
    period: str = Query("2y", description="yfinance period, e.g., max, 2y, 1y, 6mo")
):
    """
    Prediksi harga Solana pada tanggal tertentu (maks 60 hari ke depan).
    Gunakan ?period=2y untuk lebih cepat, atau ?period=max untuk penuh.
    """
    df = get_prices_cached("SOL-USD", period, "1d")
    series_scaled = scaler.transform(df[["Close"]].values)

    last_date = df.index[-1].date()
    target = datetime.strptime(target_date, "%Y-%m-%d").date()
    days_ahead = (target - last_date).days

    if days_ahead <= 0:
        return {"error": f"Tanggal harus setelah data terakhir ({last_date})"}
    if days_ahead > 60:
        return {"error": "Tanggal terlalu jauh. Maksimal 60 hari ke depan."}

    preds = forecast_recursive(model, series_scaled, steps=days_ahead)
    target_price = float(preds[-1])

    payload = {
        "last_date": str(last_date),
        "target_date": str(target),
        "days_ahead": days_ahead,
        "predicted_price": target_price
    }
    return JSONResponse(payload, headers={"Cache-Control": "public, max-age=300"})

@app.get("/forecast")
def forecast(period: str = Query("2y", description="yfinance period, e.g., max, 2y, 1y, 6mo")):
    """
    Mengirim:
      - history: 60 hari actual terakhir
      - eval:    60 hari paired (actual vs predicted)
      - forecast: 30 hari prediksi ke depan
    """
    # Coba ambil dari cache forecast (per period)
    key = (period, "1d")
    now = time.time()
    if key in _FORECAST_CACHE:
        data, ts = _FORECAST_CACHE[key]
        if now - ts < FORECAST_TTL_SEC:
            return JSONResponse(data, headers={"Cache-Control": "public, max-age=300"})

    df = get_prices_cached("SOL-USD", period, "1d")
    series_scaled = scaler.transform(df[["Close"]].values)

    # 30 hari ke depan
    preds_next_30 = forecast_recursive(model, series_scaled, steps=30)
    future_dates = pd.date_range(
        start=df.index[-1] + pd.Timedelta(days=1),
        periods=30, freq="D"
    )

    # paired backtest 60 hari terakhir
    eval_pairs = backtest_predictions(
        model=model,
        series_scaled=series_scaled,
        df_close=df["Close"],
        span=60
    )

    result = {
        "history": [
            {"date": str(d.date()), "price": float(p)}
            for d, p in zip(df.index[-60:], df["Close"].tail(60).values)
        ],
        "eval": eval_pairs,
        "forecast": [
            {"date": str(d.date()), "price": float(p)}
            for d, p in zip(future_dates, preds_next_30)
        ],
    }
    _FORECAST_CACHE[key] = (result, now)
    print(f"[Cache] Forecast regenerated ({period}) at {time.strftime('%H:%M:%S')}")
    return JSONResponse(result, headers={"Cache-Control": "public, max-age=300"})

# Local run
if __name__ == "__main__":
    import uvicorn
    # Jalankan di 8001 agar tidak bentrok dengan Laravel
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)