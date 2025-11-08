from fastapi import FastAPI, Query, BackgroundTasks
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
import asyncio
from concurrent.futures import ThreadPoolExecutor

# ==========================================================
# App & CORS
# ==========================================================
app = FastAPI(title="SOL Forecast API", version="1.2")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
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
print("[Startup] Loading model and scaler...")
model = keras.models.load_model(
    MODEL_PATH,
    custom_objects={
        "MeanSquaredError": tf.keras.losses.MeanSquaredError,
        "MeanAbsoluteError": tf.keras.metrics.MeanAbsoluteError,
    }
)
scaler: MinMaxScaler = joblib.load(SCALER_PATH)
print("[Startup] Model loaded successfully!")

# Thread pool untuk operasi IO-bound (yfinance download)
executor = ThreadPoolExecutor(max_workers=3)

# ==========================================================
# Cache sederhana (in-memory) - TTL diperpanjang
# ==========================================================
_PRICE_CACHE: dict[Tuple[str, str, str], Tuple[pd.DataFrame, float]] = {}
PRICE_TTL_SEC = 1800  # 30 menit (lebih lama dari 5 menit)

_FORECAST_CACHE: dict[Tuple[str, str], Tuple[dict, float]] = {}
FORECAST_TTL_SEC = 1800  # 30 menit

# Flag untuk prevent duplicate downloads
_DOWNLOAD_LOCKS = {}

async def get_prices_cached_async(symbol="SOL-USD", period="2y", interval="1d") -> pd.DataFrame:
    """Async wrapper untuk download yfinance dengan caching."""
    key = (symbol, period, interval)
    now = time.time()
    
    # Check cache first
    if key in _PRICE_CACHE:
        df, ts = _PRICE_CACHE[key]
        if now - ts < PRICE_TTL_SEC:
            print(f"[Cache HIT] {symbol} ({period}, {interval})")
            return df.copy()
    
    # Prevent duplicate downloads
    if key in _DOWNLOAD_LOCKS:
        print(f"[Cache] Waiting for ongoing download {key}...")
        while key in _DOWNLOAD_LOCKS:
            await asyncio.sleep(0.1)
        return _PRICE_CACHE[key][0].copy() if key in _PRICE_CACHE else None
    
    # Download in thread pool (blocking operation)
    _DOWNLOAD_LOCKS[key] = True
    try:
        print(f"[Cache MISS] Downloading {symbol} ({period}, {interval})...")
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(
            executor,
            lambda: yf.download(
                symbol, period=period, interval=interval,
                auto_adjust=False, progress=False
            )
        )
        df = df[["Close"]].dropna()
        _PRICE_CACHE[key] = (df, now)
        print(f"[Cache] Downloaded {len(df)} rows for {symbol}")
        return df.copy()
    finally:
        _DOWNLOAD_LOCKS.pop(key, None)

def inverse_target(scaled_1d, scaler: MinMaxScaler) -> np.ndarray:
    scaled_1d = np.array(scaled_1d).reshape(-1, 1)
    inv = scaler.inverse_transform(scaled_1d)
    return inv.ravel()

def forecast_recursive(model, series_scaled: np.ndarray, steps: int = 30) -> np.ndarray:
    """Prediksi recursive dengan batching untuk efisiensi."""
    buf = series_scaled.copy()
    preds_scaled: List[float] = []
    
    # Predict in smaller batches to reduce overhead
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
    """Compute historical predictions for evaluation."""
    N = series_scaled.shape[0]
    dates = df_close.index
    preds: List[float] = []
    acts: List[float] = []
    out_dates: List[pd.Timestamp] = []

    # Only compute for last 'span' days
    start_idx = max(WINDOW, N - span)
    
    for i in range(start_idx, N):
        x = series_scaled[i - WINDOW:i, :].reshape(1, WINDOW, 1)
        y_hat_scaled = model.predict(x, verbose=0).squeeze()
        y_hat = float(inverse_target([y_hat_scaled], scaler)[0])
        preds.append(y_hat)

        val = df_close.iloc[i]
        if hasattr(val, "item"):
            val = val.item()
        acts.append(float(val))
        out_dates.append(dates[i])

    return [
        {"date": str(d.date()), "actual": a, "predicted": p}
        for d, a, p in zip(out_dates, acts, preds)
    ]

# ==========================================================
# Background task untuk pre-warming cache
# ==========================================================
async def warm_cache_background():
    """Pre-load data di background untuk menghindari cold start."""
    try:
        print("[Background] Starting cache warm-up...")
        # Pre-load 2y data (lebih cepat dari max)
        await get_prices_cached_async("SOL-USD", "2y", "1d")
        print("[Background] Cache warmed successfully!")
    except Exception as e:
        print(f"[Background] Warm cache failed: {e}")

@app.on_event("startup")
async def startup_event():
    """Startup tasks."""
    print("[Startup] API starting...")
    # Warm cache di background (non-blocking)
    asyncio.create_task(warm_cache_background())
    print("[Startup] API ready!")

# ==========================================================
# Routes (sekarang async)
# ==========================================================
@app.get("/health")
async def health():
    cache_info = {
        "price_cache_entries": len(_PRICE_CACHE),
        "forecast_cache_entries": len(_FORECAST_CACHE)
    }
    return {"status": "ok", "cache": cache_info}

@app.get("/predict")
async def predict(period: str = Query("2y", description="yfinance period")):
    """Prediksi next day berdasarkan window terakhir."""
    df = await get_prices_cached_async("SOL-USD", period, "1d")
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
    return JSONResponse(
        payload, 
        headers={
            "Cache-Control": "public, max-age=1800",
            "X-Cache-Status": "HIT" if (("SOL-USD", period, "1d") in _PRICE_CACHE) else "MISS"
        }
    )

@app.get("/predict_date")
async def predict_date(
    target_date: str,
    period: str = Query("2y", description="yfinance period")
):
    """Prediksi harga pada tanggal tertentu (maks 60 hari)."""
    df = await get_prices_cached_async("SOL-USD", period, "1d")
    series_scaled = scaler.transform(df[["Close"]].values)

    last_date = df.index[-1].date()
    try:
        target = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        return JSONResponse(
            {"error": "Format tanggal salah. Gunakan YYYY-MM-DD"}, 
            status_code=400
        )

    days_ahead = (target - last_date).days

    if days_ahead <= 0:
        return JSONResponse(
            {"error": f"Tanggal harus setelah data terakhir ({last_date})"}, 
            status_code=400
        )
    if days_ahead > 60:
        return JSONResponse(
            {"error": "Tanggal terlalu jauh. Maksimal 60 hari ke depan."}, 
            status_code=400
        )

    preds = forecast_recursive(model, series_scaled, steps=days_ahead)
    target_price = float(preds[-1])

    payload = {
        "last_date": str(last_date),
        "target_date": str(target),
        "days_ahead": days_ahead,
        "predicted_price": target_price
    }
    return JSONResponse(
        payload, 
        headers={"Cache-Control": "public, max-age=1800"}
    )

@app.get("/forecast")
async def forecast(period: str = Query("2y", description="yfinance period")):
    """
    History (60 days) + Eval (60 days paired) + Forecast (30 days ahead).
    Menggunakan cache untuk response yang cepat.
    """
    key = (period, "1d")
    now = time.time()
    
    # Check forecast cache
    if key in _FORECAST_CACHE:
        data, ts = _FORECAST_CACHE[key]
        if now - ts < FORECAST_TTL_SEC:
            print(f"[Forecast Cache HIT] {period}")
            return JSONResponse(
                data, 
                headers={
                    "Cache-Control": "public, max-age=1800",
                    "X-Cache-Status": "HIT"
                }
            )

    print(f"[Forecast Cache MISS] Computing {period}...")
    df = await get_prices_cached_async("SOL-USD", period, "1d")
    series_scaled = scaler.transform(df[["Close"]].values)

    # 30 hari forecast
    preds_next_30 = forecast_recursive(model, series_scaled, steps=30)
    future_dates = pd.date_range(
        start=df.index[-1] + pd.Timedelta(days=1),
        periods=30, freq="D"
    )

    # Eval pairs (60 hari terakhir)
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
    
    # Save to cache
    _FORECAST_CACHE[key] = (result, now)
    print(f"[Forecast] Cached result for {period}")
    
    return JSONResponse(
        result, 
        headers={
            "Cache-Control": "public, max-age=1800",
            "X-Cache-Status": "MISS"
        }
    )

# ==========================================================
# Admin endpoint untuk clear cache (opsional)
# ==========================================================
@app.post("/admin/clear-cache")
async def clear_cache():
    """Clear all caches (untuk testing/debug)."""
    global _PRICE_CACHE, _FORECAST_CACHE
    _PRICE_CACHE.clear()
    _FORECAST_CACHE.clear()
    return {"message": "Cache cleared", "status": "ok"}

# Local run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)