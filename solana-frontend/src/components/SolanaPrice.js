import React, { useEffect, useState } from "react";
import axios from "axios";

function SolanaPrice() {
  const [price, setPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
  const fetchPrice = async () => {
    try {
      const res = await axios.get(
        "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
      );
      const newPrice = parseFloat(res.data.price);

      setPrevPrice(price);
      setPrice(newPrice.toFixed(2));

      const now = new Date();
      const formatter = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      });
      setLastUpdated(formatter.format(now));
    } catch (err) {
      console.error("Gagal ambil harga:", err);
    }
  };

  fetchPrice();
  const interval = setInterval(fetchPrice, 10000);
  return () => clearInterval(interval);
  // ✅ tidak ada dependency karena fetchPrice didefinisikan di dalam
}, [price]); // bisa [price] kalau mau update prevPrice benar


  // tentukan warna harga
  let priceColor = "#fff";
  if (prevPrice !== null) {
    if (price > prevPrice) priceColor = "limegreen";
    else if (price < prevPrice) priceColor = "red";
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ marginBottom: "10px", color: "#4CAF50" }}>
        Solana Actual Price:
      </h3>

      {price ? (
        <>
          <p
            style={{
              fontSize: "36px", // ✅ harga gede
              fontWeight: "bold",
              color: priceColor,
              margin: "5px 0",
            }}
          >
            ${price}
          </p>
          <p style={{ fontSize: "14px", color: "#ccc" }}>
            As of today at {lastUpdated} WIB
          </p>
        </>
      ) : (
        <p style={{ color: "#ccc" }}>⏳ Loading...</p>
      )}
    </div>
  );
}

export default SolanaPrice;