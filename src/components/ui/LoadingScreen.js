// src/components/ui/LoadingScreen.js
import React, { useState, useEffect } from "react";
import "./LoadingScreen.css";

const LoadingScreen = ({ message, progress: externalProgress = null }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (externalProgress !== null) {
      setProgress(externalProgress);
    } else {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) clearInterval(timer);
          return Math.min(prev + Math.random() * 10, 90);
        });
      }, 300);
      return () => clearInterval(timer);
    }
  }, [externalProgress]);

  useEffect(() => {
    if (externalProgress === null && progress >= 90) {
      const finishTimer = setTimeout(() => setProgress(100), 500);
      return () => clearTimeout(finishTimer);
    }
  }, [progress, externalProgress]);

  return (
    <div className="loading-screen-overlay">
      <div className="loading-screen-content">
        <div className="loading-logo">
          <img src="logo.jpeg" alt="Bilca" className="logo-img" />
        </div>
        <p className="loading-message">{message}</p>
        <div className="loading-progress-container">
          <div
            className="loading-progress-bar"
            style={{ width: `${progress}%`, background: "#4A9D9C" }}
          ></div>
        </div>
        <span className="loading-progress-text">{progress}%</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
