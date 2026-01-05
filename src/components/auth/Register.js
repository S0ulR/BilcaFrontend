// frontend/src/components/auth/Register.js
import React, { useState, useContext } from "react";
import API from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase";
import { ToastContext } from "../../context/ToastContext";
import "./Register.css";

const Register = ({ setUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    phone: "",
    birthday: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    country: "",
    professions: [],
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { success: showToast } = useContext(ToastContext);

  const countries = [
    "Argentina",
    "Bolivia",
    "Brasil",
    "Chile",
    "Colombia",
    "Costa Rica",
    "Cuba",
    "Ecuador",
    "El Salvador",
    "España",
    "Estados Unidos",
    "Guatemala",
    "Honduras",
    "México",
    "Nicaragua",
    "Panamá",
    "Paraguay",
    "Perú",
    "Puerto Rico",
    "República Dominicana",
    "Uruguay",
    "Venezuela",
  ];

  const validProfessions = [
    { value: "plomero", label: "Plomero/a" },
    { value: "electricista", label: "Electricista" },
    { value: "niñero", label: "Niñero/a" },
    { value: "albañil", label: "Albañil" },
    { value: "jardinero", label: "Jardinero/a" },
    { value: "carpintero", label: "Carpintero/a" },
    { value: "pintor", label: "Pintor/a" },
    { value: "limpieza", label: "Limpieza" },
    { value: "paseador de perros", label: "Paseador de perros" },
    { value: "cuidadores de adultos", label: "Cuidadores de adultos mayores" },
    { value: "mudanzas", label: "Mudanzas" },
    { value: "gasista", label: "Gasista" },
  ];

  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    notCommon: !["12345678", "password", "admin", "contraseña"].includes(
      formData.password.toLowerCase()
    ),
  };

  const isValidName = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}$/.test(formData.name);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "role") {
      setFormData((prev) => ({
        ...prev,
        role: value,
        professions: value !== "worker" ? [] : prev.professions,
      }));
    } else if (name === "professions") {
      setFormData((prev) => {
        const updated = checked
          ? [...prev.professions, value]
          : prev.professions.filter((p) => p !== value);
        return { ...prev, professions: updated };
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidName) {
      setError(
        "El nombre debe tener al menos 2 letras y no contener números ni símbolos."
      );
      return;
    }

    if (!isValidEmail) {
      setError("El formato del email no es válido.");
      return;
    }

    if (!formData.country.trim()) {
      setError("Debes seleccionar un país.");
      return;
    }

    if (!formData.city.trim()) {
      setError("La ciudad es obligatoria.");
      return;
    }

    if (!formData.phone.trim()) {
      setError("El número de teléfono es obligatorio.");
      return;
    }

    if (formData.role === "worker" && formData.professions.length === 0) {
      setError("Debes seleccionar al menos una profesión.");
      return;
    }

    const invalidProfession = formData.professions.find(
      (p) => !validProfessions.some((vp) => vp.value === p)
    );
    if (invalidProfession) {
      setError("Una o más profesiones seleccionadas no son válidas.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (
      !passwordRequirements.length ||
      !passwordRequirements.uppercase ||
      !passwordRequirements.number ||
      !passwordRequirements.special ||
      !passwordRequirements.notCommon
    ) {
      setError("La contraseña no cumple con todos los requisitos.");
      return;
    }

    const dataToSend = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      phone: formData.phone.trim(),
      country: formData.country.trim(),
      birthday: formData.birthday,
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === "worker") {
      dataToSend.services = formData.professions.map((prof) => ({
        profession: prof,
        isActive: true,
      }));
    }

    try {
      const res = await API.post("/auth/register", dataToSend);
      const { token, user, sessionId } = res.data;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("sessionId", sessionId);
      if (setUser) setUser(user);

      const firstName = user.name.split(" ")[0];
      showToast("Cuenta creada", `¡Bienvenido a Bilca, ${firstName}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || "Error en el registro");
    }
  };

  const getLabel = (value) =>
    validProfessions.find((p) => p.value === value)?.label || value;

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await exchangeFirebaseToken(result.user);
    } catch (error) {
      setError("Error al registrarse con Google: " + error.message);
    }
  };

  const handleAppleSignUp = async () => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");

    try {
      const result = await signInWithPopup(auth, provider);
      await exchangeFirebaseToken(result.user);
    } catch (error) {
      setError("Error al registrarse con Apple: " + error.message);
    }
  };

  const exchangeFirebaseToken = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await API.post("/auth/firebase", { idToken });
      const { token, user, sessionId } = res.data;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("sessionId", sessionId);
      if (setUser) setUser(user);

      const firstName = user.name.split(" ")[0];
      showToast("Cuenta creada", `¡Bienvenido a Bilca, ${firstName}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || "Error al conectar con el servidor");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Bilca</h1>
          <p>
            Crea tu cuenta y comienza a ofrecer servicios o encontrar
            profesionales
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="error">{error}</div>}

          <div className="input-group stacked">
            <label htmlFor="name">Nombre</label>
            <div className="input-wrapper">
              <input
                id="name"
                name="name"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group stacked">
              <label htmlFor="birthday">Fecha de nacimiento</label>
              <div className="input-wrapper">
                <input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group stacked">
              <label htmlFor="city">Ciudad</label>
              <div className="input-wrapper">
                <input
                  id="city"
                  name="city"
                  placeholder="Ej: Rosario"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group stacked">
              <label htmlFor="country">País</label>
              <div className="input-wrapper select-wrapper">
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu país</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group stacked">
              <label htmlFor="phone">Teléfono</label>
              <div className="input-wrapper">
                <input
                  id="phone"
                  name="phone"
                  placeholder="Sin 0 ni 15"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

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
                autoComplete="new-password"
              />
              <i
                className={`fa ${
                  showPassword ? "fa-eye" : "fa-eye-slash"
                } toggle-visibility`}
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              ></i>
            </div>
          </div>

          <div className="input-group stacked">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <i
                className={`fa ${
                  showConfirmPassword ? "fa-eye" : "fa-eye-slash"
                } toggle-visibility`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                role="button"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación"
                    : "Mostrar confirmación"
                }
              ></i>
            </div>
          </div>

          <div className="password-requirements">
            <p
              style={{ color: passwordRequirements.length ? "green" : "#999" }}
            >
              • Mínimo 8 caracteres
            </p>
            <p
              style={{
                color: passwordRequirements.uppercase ? "green" : "#999",
              }}
            >
              • Al menos una mayúscula
            </p>
            <p
              style={{ color: passwordRequirements.number ? "green" : "#999" }}
            >
              • Al menos un número
            </p>
            <p
              style={{ color: passwordRequirements.special ? "green" : "#999" }}
            >
              • Carácter especial (!@#$%...)
            </p>
            <p
              style={{
                color: passwordRequirements.notCommon ? "green" : "#999",
              }}
            >
              • No usar contraseñas comunes
            </p>
          </div>

          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="role"
                value="user"
                checked={formData.role === "user"}
                onChange={handleChange}
              />
              Solo necesito servicios
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="worker"
                checked={formData.role === "worker"}
                onChange={handleChange}
              />
              Ofrezco servicios
            </label>
          </div>

          {formData.role === "worker" && (
            <div className="checkbox-group">
              <label className="group-label">Selecciona tus oficios:</label>
              <div className="checkbox-grid">
                {validProfessions.map((profession) => (
                  <label key={profession.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="professions"
                      value={profession.value}
                      checked={formData.professions.includes(profession.value)}
                      onChange={handleChange}
                    />
                    {profession.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="social-login">
            <button
              type="button"
              className="btn-social btn-google"
              onClick={handleGoogleSignUp}
            >
              <i className="fab fa-google"></i>
              <span>Registrarse con Google</span>
            </button>
            <button
              type="button"
              className="btn-social btn-apple"
              onClick={handleAppleSignUp}
            >
              <i className="fab fa-apple"></i>
              <span>Registrarse con Apple</span>
            </button>
          </div>

          <button type="submit" className="btn-primary btn-block">
            Registrarse
          </button>

          <p className="register-link">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="link-accent">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
