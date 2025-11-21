// src/components/pages/Privacy.js
import React from "react";
import Breadcrumb from "../components/ui/Breadcrumb";
import "./Privacy.css";

const Privacy = () => {
  return (
    <div className="privacy-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/" },
          { label: "Política de privacidad", active: true },
        ]}
      />
      <div className="privacy-content">
        <h1 className="page-title">Política de Privacidad</h1>
        <p className="intro-text">
          En Bilca, respetamos y protegemos su privacidad. Esta Política de Privacidad
          explica cómo recopilamos, usamos y protegemos su información personal.
        </p>

        <div className="privacy-section">
          <h2 className="section-title">1. Información que Recopilamos</h2>
          <p>
            Recopilamos información que usted proporciona directamente al registrarse,
            crear un perfil o al interactuar con la plataforma. Esto puede incluir su
            nombre, dirección de correo electrónico, número de teléfono, ubicación,
            servicios ofrecidos o solicitados, y cualquier otra información que elija
            compartir.
          </p>
        </div>

        <div className="privacy-section">
          <h2 className="section-title">2. Cómo Usamos Su Información</h2>
          <p>
            Usamos su información para facilitar la conexión entre usuarios y profesionales,
            gestionar su cuenta, personalizar su experiencia, enviar comunicaciones
            relacionadas con el servicio y mejorar nuestra plataforma.
          </p>
        </div>

        <div className="privacy-section">
          <h2 className="section-title">3. Compartición de Información</h2>
          <p>
            No vendemos, comerciamos ni alquilamos su información personal a terceros.
            Podemos compartir su información con profesionales o usuarios cuando usted
            inicia una solicitud o contratación, o con proveedores de servicios que nos
            ayudan a operar la plataforma, siempre bajo estrictos acuerdos de confidencialidad.
          </p>
        </div>

        <div className="privacy-section">
          <h2 className="section-title">4. Seguridad de la Información</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger su
            información personal contra accesos no autorizados, alteraciones, divulgación
            o destrucción.
          </p>
        </div>

        <div className="privacy-section">
          <h2 className="section-title">5. Derechos del Usuario</h2>
          <p>
            Usted tiene derecho a acceder, corregir, actualizar o eliminar su información
            personal en cualquier momento. También puede revocar su consentimiento para
            el tratamiento de sus datos.
          </p>
        </div>

        <div className="privacy-section">
          <h2 className="section-title">6. Cookies</h2>
          <p>
            Utilizamos cookies y tecnologías similares para mejorar la funcionalidad de
            nuestra plataforma. Puede configurar su navegador para rechazar cookies,
            aunque esto podría afectar la experiencia de uso.
          </p>
        </div>

        <div className="privacy-section">
          <h2 className="section-title">7. Cambios en la Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad en cualquier momento. Las
            modificaciones se publicarán en esta página y se harán efectivas inmediatamente
            después de su publicación.
          </p>
        </div>

        <div className="privacy-section">
          <h2 className="section-title">8. Contacto</h2>
          <p>
            Si tiene alguna pregunta sobre esta Política de Privacidad, contáctenos
            a través de la sección de <a href="/contact">Contacto</a> de nuestra plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
