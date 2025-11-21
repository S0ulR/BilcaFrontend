// src/components/pages/Terms.js
import React from "react";
import Breadcrumb from "../components/ui/Breadcrumb";
import "./Terms.css";

const Terms = () => {
  return (
    <div className="terms-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/" },
          { label: "Términos y condiciones", active: true },
        ]}
      />
      <div className="terms-content">
        <h1 className="page-title">Términos y Condiciones</h1>
        <p className="intro-text">
          Bienvenido a Bilca. Estos términos y condiciones regulan el uso de nuestra plataforma
          para conectar usuarios que buscan servicios con profesionales que los ofrecen.
        </p>

        <div className="terms-section">
          <h2 className="section-title">1. Aceptación de Términos</h2>
          <p>
            Al acceder y utilizar esta plataforma, usted acepta cumplir con estos Términos
            y Condiciones, así como con todas las leyes y regulaciones aplicables. Si no
            está de acuerdo con alguno de estos términos, no debe utilizar este sitio.
          </p>
        </div>

        <div className="terms-section">
          <h2 className="section-title">2. Descripción del Servicio</h2>
          <p>
            Bilca es una plataforma digital que facilita la conexión entre usuarios que
            requieren servicios y profesionales que los brindan. La plataforma no actúa
            como parte en la relación contractual entre las partes ni se responsabiliza
            por la calidad, seguridad o legalidad de los servicios ofrecidos.
          </p>
        </div>

        <div className="terms-section">
          <h2 className="section-title">3. Responsabilidad del Usuario</h2>
          <p>
            Los usuarios son responsables de proporcionar información veraz y actualizada.
            Asimismo, son responsables de todas las actividades que ocurran bajo su cuenta
            y de mantener la confidencialidad de sus credenciales.
          </p>
        </div>

        <div className="terms-section">
          <h2 className="section-title">4. Responsabilidad del Profesional</h2>
          <p>
            Los profesionales son responsables de la veracidad de la información publicada
            en su perfil, así como de la calidad, cumplimiento y legalidad de los servicios
            que ofrezcan. Bilca no garantiza ni supervisa directamente la prestación del servicio.
          </p>
        </div>

        <div className="terms-section">
          <h2 className="section-title">5. Limitación de Responsabilidad</h2>
          <p>
            Bilca no será responsable por daños directos, indirectos, incidentales, especiales
            o consecuentes que surjan del uso de la plataforma o de la relación entre usuarios
            y profesionales. La plataforma se ofrece "tal cual" y "según disponibilidad".
          </p>
        </div>

        <div className="terms-section">
          <h2 className="section-title">6. Modificaciones de los Términos</h2>
          <p>
            Bilca se reserva el derecho de modificar estos Términos y Condiciones en cualquier
            momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación.
            El uso continuado de la plataforma constituye aceptación de dichos cambios.
          </p>
        </div>

        <div className="terms-section">
          <h2 className="section-title">7. Ley Aplicable</h2>
          <p>
            Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes
            de Argentina, sin considerar conflictos de leyes.
          </p>
        </div>

        <div className="terms-section">
          <h2 className="section-title">8. Contacto</h2>
          <p>
            Para cualquier duda o consulta sobre estos Términos y Condiciones, por favor
            contáctenos a través de la sección de <a href="/contact">Contacto</a> de nuestra plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
