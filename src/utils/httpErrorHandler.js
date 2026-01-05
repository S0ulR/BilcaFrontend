// src/utils/httpErrorHandler.js
export const handleHttpError = ({
  err,
  showError,
  navigate,
  actionLabel = "continuar",
  redirectOnAuth = true,
}) => {
  const status = err.response?.status;

  if (status === 401) {
    showError(
      "Inicia sesión",
      `Para ${actionLabel} debes ingresar a tu cuenta.`
    );

    if (redirectOnAuth && navigate) {
      setTimeout(() => navigate("/login"), 1500);
    }
    return true;
  }

  if (status === 403) {
    showError(
      "Acceso restringido",
      "No tenés permisos para realizar esta acción."
    );
    return true;
  }

  if (status === 409) {
    showError(
      "Solicitud duplicada",
      err.response?.data?.msg ||
        "Ya existe una solicitud similar reciente."
    );
    return true;
  }

  if (status === 400) {
    showError(
      "Datos inválidos",
      err.response?.data?.msg || "Revisá los datos ingresados."
    );
    return true;
  }

  showError(
    "Error",
    "Ocurrió un error inesperado. Intentalo nuevamente."
  );
  return true;
};

