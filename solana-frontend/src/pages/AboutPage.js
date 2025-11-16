import React from "react";
import profilePhoto from "../assets/russel-profile.png";

function AboutPage() {
  const techItems = [
    {
      name: "React.js",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    },
    {
      name: "FastAPI",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg",
    },
    {
      name: "TensorFlow",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
    },
    {
      name: "Python",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    },
    {
      name: "yFinance",
      logo: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
    },
    {
      name: "Recharts",
      logo: "https://avatars.githubusercontent.com/u/75646943?s=280&v=4",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#0e1120",
        color: "white",
        paddingTop: "90px",
        paddingBottom: "50px",
      }}
    >
      {/* TITLE */}
      <h1
        style={{
          fontSize: "42px",
          fontWeight: "800",
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        About SolanaView
      </h1>

      <p
        style={{
          textAlign: "center",
          fontSize: "18px",
          opacity: 0.8,
          marginBottom: "50px",
        }}
      >
        Learn more about the technology, research purpose, and developer behind this project.
      </p>

      {/* ================================
          TECH STACK SECTION
      ================================= */}
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
          background: "rgba(255,255,255,0.05)",
          padding: "35px",
          borderRadius: "18px",
          boxShadow: "0 0 25px rgba(0,255,163,0.1)",
          marginBottom: "50px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "18px",
            textAlign: "center",
            color: "#00FFA3",
          }}
        >
          Technology Stack
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "40px",
            marginTop: "25px",
          }}
        >
          {techItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 0 15px rgba(0,255,163,0.1)",
              }}
            >
              <img
                src={item.logo}
                alt={item.name}
                style={{ width: "50px", height: "50px", marginBottom: "8px" }}
              />
              <span style={{ fontSize: "14px", opacity: 0.9 }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================================
          PURPOSE SECTION
      ================================= */}
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
          background: "rgba(255,255,255,0.05)",
          padding: "35px",
          borderRadius: "18px",
          boxShadow: "0 0 25px rgba(29,136,255,0.15)",
          marginBottom: "50px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "18px",
            textAlign: "center",
            color: "#1d8bf1",
          }}
        >
          Purpose of This Project
        </h2>

        <p
          style={{
            fontSize: "18px",
            lineHeight: "1.7",
            opacity: 0.9,
            textAlign: "center",
          }}
        >
          SolanaView was developed as part of a research project and final thesis focused on
          deep learning forecasting for cryptocurrency price prediction.
          <br /> <br />
          This system demonstrates the implementation of a hybrid CNN-BiLSTM model to analyze historical
          Solana (SOL) data and forecast future movement trends.  
          It serves both academic research purposes and practical insights for real-world crypto analysis.
        </p>
      </div>

      {/* ================================
          DEVELOPER PROFILE
      ================================= */}
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
          background: "rgba(255,255,255,0.05)",
          padding: "40px",
          borderRadius: "18px",
          textAlign: "center",
          boxShadow: "0 0 25px rgba(255,255,255,0.1)",
          alignItems: "center",
        }}
      >
        <img
          src={profilePhoto}
          alt="Developer"
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid rgba(255,255,255,0.3)",
            marginBottom: "20px",
            margin: "0 auto",
          }}
        />

        <h2 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "10px" }}>
          Russel Figo
        </h2>

        <p
          style={{
            fontSize: "18px",
            opacity: 0.9,
            maxWidth: "700px",
            margin: "0 auto",
            lineHeight: "1.8",
          }}
        >
          Informatics Engineering student at Universitas Bunda Mulia.
          Specializing in Deep Learning, Cryptocurrency Forecasting,
          Machine Learning Engineering, and Full-Stack Development.
        </p>
      </div>
    </div>
  );
}

export default AboutPage;