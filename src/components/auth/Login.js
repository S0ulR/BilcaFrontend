// src/components/auth/Login.js
import React, { useState, useContext } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { ToastContext } from "../../context/ToastContext";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { auth } from "../../firebase";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { success: showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trimStart(),
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  if (!formData.email || !formData.password) {
    setError("Por favor completa todos los campos");
    setLoading(false);
    return;
  }

  try {
    const res = await API.post("/auth/login", {
      email: formData.email.toLowerCase().trim(),
      password: formData.password.trim(),
    });

    const { token, user, sessionId } = res.data; // Recibimos el sessionId

    if (!token || !user || !sessionId) {
      throw new Error("Datos incompletos en la respuesta");
    }

    // Guardar sessionId en sessionStorage junto con token y user
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionId");

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("sessionId", sessionId);

    login(user, token, sessionId); // Pasamos sessionId al contexto

    const firstName = user.name?.split(" ")[0] || "Usuario";
    showToast("Bienvenido", `¡Bienvenido de vuelta, ${firstName}! 🎉`);

    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 800);
  } catch (err) {
    console.error("Error en login:", err);
    setError(
      err.response?.data?.msg ||
      err.message ||
      "Credenciales incorrectas o servidor no disponible"
    );
  } finally {
    setLoading(false);
  }
};

  // ✅ Flujo unificado con Firebase (igual que en Register)
  const exchangeFirebaseToken = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await API.post("/auth/firebase", { idToken });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      login(user, token);

      const firstName = user.name?.split(" ")[0] || "Usuario";
      showToast("Bienvenido", `¡Bienvenido de vuelta, ${firstName}! 🎉`);

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 800);
    } catch (err) {
      setError(err.response?.data?.msg || "Error al iniciar sesión con esta cuenta");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await exchangeFirebaseToken(result.user);
    } catch (error) {
      setError("Error al iniciar sesión con Google: " + error.message);
    }
  };

  const handleAppleLogin = async () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    try {
      const result = await signInWithPopup(auth, provider);
      await exchangeFirebaseToken(result.user);
    } catch (error) {
      setError("Error al iniciar sesión con Apple: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Bilca</h1>
          <p>Encuentra el profesional ideal cerca de ti</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error">{error}</div>}

          <div className="input-group stacked">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group stacked">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <i
                className={`fa ${showPassword ? "fa-eye" : "fa-eye-slash"} toggle-visibility`}
                onClick={togglePasswordVisibility}
                role="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              ></i>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Mantener sesión iniciada</span>
            </label>
            <a href="/forgotpassword" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" disabled={loading} className="btn-primary btn-block">
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Iniciando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>

          <div className="divider">
            <span>O inicia con</span>
          </div>

          <div className="social-login">
            <button
              type="button"
              className="btn-social btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <i className="fab fa-google"></i>
              <span>Iniciar con Google</span>
            </button>
            <button
              type="button"
              className="btn-social btn-apple"
              onClick={handleAppleLogin}
              disabled={loading}
            >
              <i className="fab fa-apple"></i>
              <span>Iniciar con Apple</span>
            </button>
          </div>

          <p className="register-link">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="link-accent">
              Regístrate
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
