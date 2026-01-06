// src/components/pages/AboutUs.js
import React from "react";
import Breadcrumb from "../components/ui/Breadcrumb";
import "./AboutUs.css";

const AboutUs = () => {
  return (
    <div className="about-us-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/" },
          { label: "Sobre nosotros", active: true },
        ]}
      />
      <div className="about-content">
        <h1 className="page-title">Sobre Bilca</h1>
        <p className="intro-text">
          Somos Bilca, una plataforma dedicada a conectar trabajadores
          informales con personas que necesitan servicios cercanos y confiables
          en Latinoamérica.
        </p>

        <div className="about-section">
          <h2 className="section-title">Nuestra Misión</h2>
          <p>
            Nuestra misión es empoderar a trabajadores informales y conectarlos
            con quienes necesitan sus servicios, promoviendo la economía local y
            el trabajo digno en toda Latinoamérica.
          </p>
        </div>

        <div className="about-section">
          <h2 className="section-title">Nuestra Visión</h2>
          <p>
            Ser la plataforma líder en Latinoamérica para la contratación de
            servicios informales, basada en confianza, valoraciones reales y
            cercanía geográfica.
          </p>
        </div>

        <div className="about-section">
          <h2 className="section-title">Nuestros Valores</h2>
          <p>
            Trabajamos con transparencia, inclusión y compromiso social. Creemos
            en el poder del trabajo informal y en su capacidad para transformar
            comunidades.
          </p>
        </div>

        <div className="about-section">
          <h2 className="section-title">Nuestro Compromiso</h2>
          <p>
            Nos comprometemos a ofrecer una plataforma segura, accesible y fácil
            de usar que beneficie tanto a quienes ofrecen servicios como a
            quienes los necesitan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
