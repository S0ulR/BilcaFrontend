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
        <h1 className="page-title">Sobre Laring-AI</h1>
        <p className="intro-text">
          Somos Laring-AI, una empresa dedicada al desarrollo de soluciones tecnológicas
          innovadoras, centradas en la ciberseguridad y la inteligencia artificial.
        </p>

        <div className="about-section">
          <h2 className="section-title">Nuestra Misión</h2>
          <p>
            Nuestra misión es proporcionar herramientas accesibles y efectivas que empoderen
            a las personas y organizaciones para navegar con seguridad en el entorno digital.
            Buscamos simplificar la ciberseguridad mediante soluciones impulsadas por IA,
            ofreciendo productos confiables y fáciles de usar para clientes en Latinoamérica.
          </p>
        </div>

        <div className="about-section">
          <h2 className="section-title">Nuestra Visión</h2>
          <p>
            Ser reconocidos como líderes en el desarrollo de plataformas tecnológicas
            que protejan, conecten y potencien a nuestros usuarios y clientes, garantizando
            la privacidad, la integridad y la confianza en cada interacción.
          </p>
        </div>

        <div className="about-section">
          <h2 className="section-title">Nuestros Productos</h2>
          <p>
            Nuestro portafolio incluye tres productos SaaS clave: <strong>Laring Guard</strong>,
            una plataforma de ciberseguridad; <strong>Laring Compliance</strong>, para automatización
            de cumplimiento normativo; y <strong>Laring Sentinel</strong>, un servicio de monitoreo
            de credenciales y dominios.
          </p>
        </div>

        <div className="about-section">
          <h2 className="section-title">Nuestro Compromiso</h2>
          <p>
            Nos comprometemos a la excelencia, la innovación constante y la responsabilidad
            social. Nuestro equipo trabaja incansablemente para ofrecer servicios de alta calidad
            que se adapten a las necesidades cambiantes del entorno digital.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
