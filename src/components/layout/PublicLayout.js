// src/components/layout/PublicLayout.js
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="main-content">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;