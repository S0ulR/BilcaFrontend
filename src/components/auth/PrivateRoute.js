// src/components/auth/PrivateRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando autenticación...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;