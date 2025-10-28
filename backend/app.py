from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler  # dipakai untuk tipe scaler yang di-load
from typing import List, Dict

# ==========================================================
# App & CORS
# ==========================================================
app = FastAPI(title="SOL Forecast API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # sesuaikan di prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# Konfigurasi
# ==========================================================
MODEL_PATH = "artifacts/model_cnn_bilstm.h5"
SCALER_PATH = "artifacts/scaler.pkl"
FEATURES: List[str] = ["Open", "High", "Low", "Close", "Volume"]
TARGET: str = "Close"
WINDOW: int = 60

# ==========================================================
# Load Model & Scaler
# ==========================================================
# NOTE: Kalau model punya custom layer/loss lain, tambahkan di custom_objects
model = tf.keras.models.load_model(
    MODEL_PATH,
    custom_objects={
        "MeanSquaredError": tf.keras.losses.MeanSquaredError,
        "MeanAbsoluteError": tf.keras.metrics.MeanAbsoluteError,
    }
)
scaler: MinMaxScaler = joblib.load(SCALER_PATH)

# ==========================================================
# Util
# ==========================================================
def inverse_target(scaled_1d, scaler: MinMaxScaler) -> np.ndarray:
    """
    Membalik skala hanya untuk kolom target (Close) tanpa mengganggu kolom lain.
    """
    scaled_1d = np.array(scaled_1d).reshape(-1)
    dummy = np.zeros((scaled_1d.shape[0], len(FEATURES)))
    t_idx = FEATURES.index(TARGET)
    dummy[:, t_idx] = scaled_1d
    inv = scaler.inverse_transform(dummy)
    return inv[:, t_idx]


def forecast_recursive(model, df_scaled_all: pd.DataFrame, scaler: MinMaxScaler, steps: int = 30) -> np.ndarray:
    """
    Prediksi ke depan (multi-step) dengan recursive strategy, memodifikasi buffer skala.
    """
    buf = df_scaled_all.values.copy()
    preds_scaled: List[float] = []
    t_idx = FEATURES.index(TARGET)

    for _ in range(steps):
        # Window terakhir sebagai input
        x = np.expand_dims(buf[-WINDOW:], axis=0)
        y_hat_scaled = model.predict(x, verbose=0).squeeze()
        preds_scaled.append(float(y_hat_scaled))

        # Buat baris baru (berdasarkan baris terakhir) lalu update
        new_row = buf[-1].copy()
        new_row[t_idx] = y_hat_scaled

        # Heuristik sederhana untuk fitur lain
        new_row[FEATURES.index("Open")] = buf[-1][t_idx]  # Open ≈ Close sebelumnya
        new_row[FEATURES.index("High")] = y_hat_scaled * 1.01
        new_row[FEATURES.index("Low")] = y_hat_scaled * 0.99

        vol_idx = FEATURES.index("Volume")
        recent_vol = buf[-20:, vol_idx].mean() if buf.shape[0] >= 20 else buf[:, vol_idx].mean()
        new_row[vol_idx] = recent_vol

        # Append ke buffer
        buf = np.vstack([buf, new_row])

    preds = inverse_target(preds_scaled, scaler)
    return preds


def backtest_predictions(
    model,
    df_scaled_all: pd.DataFrame,
    scaler: MinMaxScaler,
    df_close: pd.Series,
    span: int = 60
) -> List[Dict]:
    """
    Menghasilkan pasangan (date, actual, predicted) untuk evaluasi overlay chart.
    Prediksi untuk hari i menggunakan window [i-WINDOW : i] (tanpa 'ngintip' i).
    Hasilnya di-trim ke `span` hari terakhir agar chart ringkas.
    """
    values = df_scaled_all.values
    dates = df_scaled_all.index

    preds: List[float] = []
    acts: List[float] = []
    out_dates: List[pd.Timestamp] = []

    for i in range(WINDOW, len(values)):
        x = np.expand_dims(values[i - WINDOW:i], axis=0)
        y_hat_scaled = model.predict(x, verbose=0).squeeze()
        y_hat = float(inverse_target([y_hat_scaled], scaler)[0])

        preds.append(y_hat)
        acts.append(float(df_close.iloc[i].item()))
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
# Routes
# ==========================================================
@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/predict")
def predict():
    """
    Prediksi next day berdasarkan 60 window terakhir.
    """
    df = yf.download("SOL-USD", period="2y", interval="1d", auto_adjust=False)
    df = df[FEATURES].dropna()

    df_scaled = pd.DataFrame(
        scaler.transform(df[FEATURES]),
        index=df.index,
        columns=FEATURES
    )

    x = np.expand_dims(df_scaled.values[-WINDOW:], axis=0)
    y_hat_scaled = model.predict(x, verbose=0).squeeze()
    next_day = float(inverse_target([y_hat_scaled], scaler)[0])

    last_close = float(df["Close"].iloc[-1])
    last_date = str(df.index[-1].date())

    return {
        "date": last_date,
        "last_close": last_close,
        "pred_next_day": next_day
    }


@app.get("/forecast")
def forecast():
    """
    Mengirim:
      - history: 60 hari actual terakhir (untuk konteks)
      - eval:    60 hari paired (actual vs predicted) pada tanggal yang sama
      - forecast: 30 hari prediksi ke depan (tanpa actual)
    """
    # Ambil 2 tahun data harian
    df = yf.download("SOL-USD", period="2y", interval="1d", auto_adjust=False)
    df = df[FEATURES].dropna()

    # Scale semua fitur
    df_scaled_all = pd.DataFrame(
        scaler.transform(df[FEATURES]),
        index=df.index,
        columns=FEATURES
    )

    # 30 hari ke depan
    preds_next_30 = forecast_recursive(model, df_scaled_all, scaler, steps=30)
    future_dates = pd.date_range(
        start=df.index[-1] + pd.Timedelta(days=1),
        periods=30,
        freq="D"
    )

    # Paired backtest 60 hari terakhir (actual vs predicted)
    eval_pairs = backtest_predictions(
        model=model,
        df_scaled_all=df_scaled_all,
        scaler=scaler,
        df_close=df["Close"],
        span=60
    )

    return {
        "history": [
            {"date": str(d.date()), "price": float(p)}
            for d, p in zip(df.index[-60:], df["Close"].tail(60).values)
        ],
        "eval": eval_pairs,  # <-- gunakan ini untuk overlay actual vs predicted di chart
        "forecast": [
            {"date": str(d.date()), "price": float(p)}
            for d, p in zip(future_dates, preds_next_30)
        ],
    }


# ==========================================================
# Local run (opsional)
# ==========================================================
# Jalankan: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)