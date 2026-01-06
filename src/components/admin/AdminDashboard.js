// src/components/admin/AdminDashboard.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import API from "../../services/api";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";
import Modal from "../ui/Modal";

const COLORS = ["#4a9d9c", "#3498db", "#e74c3c", "#f39c12", "#9b59b6"];
const PROFESSIONS = [
  "plomero",
  "electricista",
  "niñero",
  "albañil",
  "jardinero",
  "carpintero",
  "pintor",
  "limpieza",
  "paseador de perros",
  "cuidadores de adultos",
  "mudanzas",
  "gasista",
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overviewData, setOverviewData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [usersData, setUsersData] = useState({
    users: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [alerts, setAlerts] = useState([]);

  const [userForm, setUserForm] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const loadUsers = useCallback(
    async (page = 1) => {
      try {
        const params = { page };
        if (searchTerm) params.search = searchTerm;
        if (userRoleFilter !== "all") params.role = userRoleFilter;

        const res = await API.get("/admin/users", { params });
        setUsersData(res.data);
      } catch (err) {
        setError("Error al cargar usuarios");
        console.error(err);
      }
    },
    [searchTerm, userRoleFilter]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (!overviewData) {
          const overviewRes = await API.get("/admin/dashboard/overview");
          setOverviewData(overviewRes.data);
          setAlerts(overviewRes.data.alerts || []);
        }

        if (activeTab === "metrics" && !metricsData) {
          const metricsRes = await API.get("/admin/dashboard/metrics");
          setMetricsData(metricsRes.data);
        } else if (activeTab === "subscriptions" && !subscriptionData) {
          try {
            const subsRes = await API.get("/admin/dashboard/subscriptions");
            setSubscriptionData(subsRes.data);
          } catch (subsErr) {
            setSubscriptionData({ growth: [], topWorkers: [] });
          }
        } else if (activeTab === "users") {
          await loadUsers(1);
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("No se pudieron cargar los datos del panel");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, loadUsers, overviewData, metricsData, subscriptionData]);

  const openUserModal = async (user) => {
    setModalLoading(true);
    try {
      const res = await API.get(`/admin/users/${user._id}`);
      const fullUser = res.data;
      setSelectedUser(fullUser);
      setUserForm({ ...fullUser });
      setIsDirty(false);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error al cargar usuario:", err);
      alert("Error al cargar los datos del usuario");
    } finally {
      setModalLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...(userForm.services || [])];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setUserForm((prev) => ({ ...prev, services: updatedServices }));
    setIsDirty(true);
  };

  const addService = () => {
    const updatedServices = [
      ...(userForm.services || []),
      { profession: PROFESSIONS[0], hourlyRate: 0, bio: "", isActive: true },
    ];
    setUserForm((prev) => ({ ...prev, services: updatedServices }));
    setIsDirty(true);
  };

  const removeService = (index) => {
    const updatedServices = [...(userForm.services || [])];
    updatedServices.splice(index, 1);
    setUserForm((prev) => ({ ...prev, services: updatedServices }));
    setIsDirty(true);
  };

  const saveUserChanges = async () => {
    try {
      setModalLoading(true);
      const res = await API.put(`/admin/users/${selectedUser._id}`, userForm);
      setSelectedUser(res.data);
      setUserForm({ ...res.data });
      setIsDirty(false);
      alert("✅ Usuario actualizado correctamente");
      if (activeTab === "users") {
        await loadUsers(usersData.page);
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("❌ Error al guardar los cambios");
    } finally {
      setModalLoading(false);
    }
  };

  const deleteUser = async () => {
    if (
      !window.confirm(
        "¿Eliminar permanentemente este usuario? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      await API.delete(`/admin/users/${selectedUser._id}`);
      setIsModalOpen(false);
      setSelectedUser(null);
      if (activeTab === "users") {
        await loadUsers(usersData.page);
      }
    } catch (err) {
      alert("Error al eliminar el usuario");
    }
  };

  const handlePageChange = (newPage) => {
    loadUsers(newPage);
  };

  const weeklyGrowthData = useMemo(() => {
    if (!metricsData?.weeklyGrowth) return [];
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return metricsData.weeklyGrowth.map((count, i) => ({
      day: days[i],
      Nuevos: count,
    }));
  }, [metricsData]);

  const apiUsageData = useMemo(() => {
    if (!metricsData?.apiUsage) return [];
    return metricsData.apiUsage.slice(-14).map((item) => ({
      date: item.date.split("-").slice(1).join("/"),
      Llamadas: item.totalCalls,
      "Error %": Math.round(item.errorRate * 100),
    }));
  }, [metricsData]);

  const roleDistribution = useMemo(() => {
    if (!overviewData?.userDistribution) return [];
    return overviewData.userDistribution.map((item) => ({
      name:
        item._id === "worker"
          ? "Trabajadores"
          : item._id === "user"
          ? "Usuarios"
          : item._id === "admin"
          ? "Admins"
          : item._id === "superadmin"
          ? "Superadmins"
          : "Otros",
      value: item.count,
    }));
  }, [overviewData]);

  const subscriptionGrowthData = useMemo(() => {
    if (!subscriptionData?.growth) return [];
    return subscriptionData.growth.map((item) => ({
      date: item.date.split("-").slice(1).join("/"),
      Nuevas: item.newSubscriptions,
    }));
  }, [subscriptionData]);

  if (loading && !overviewData) {
    return <div className="loading">Cargando panel de administración...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const safeOverview = overviewData || {
    totalUsers: 0,
    totalWorkers: 0,
    totalHires: 0,
    dau: 0,
    activeSubscriptions: 0,
    mrr: 0,
    professionalSubs: 0,
    featuredSubs: 0,
    userDistribution: [],
    infra: {
      memory: { rss: 0, heapUsed: 0 },
      uptime: 0,
      env: "desconocido",
      nodeVersion: "desconocido",
    },
  };

  const safeSubscriptionData = subscriptionData || {
    growth: [],
    topWorkers: [],
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Panel de Superadmin</h2>
        <div className="admin-header-actions">
          <span className="admin-role-badge">Rol: Superadmin</span>
          <Link to="/dashboard" className="btn-back-to-dashboard">
            ← Volver al Dashboard
          </Link>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Resumen
        </button>
        <button
          className={activeTab === "metrics" ? "active" : ""}
          onClick={() => setActiveTab("metrics")}
        >
          Métricas
        </button>
        <button
          className={activeTab === "subscriptions" ? "active" : ""}
          onClick={() => setActiveTab("subscriptions")}
        >
          Suscripciones 💰
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Gestión de Usuarios
        </button>
        <button
          className={activeTab === "infra" ? "active" : ""}
          onClick={() => setActiveTab("infra")}
        >
          Infraestructura
        </button>
      </div>

      {/* === Pestaña: Resumen === */}
      {activeTab === "overview" && (
        <div className="admin-content">
          {alerts.length > 0 && (
            <div className="alerts-section">
              <h3>⚠️ Alertas Activas</h3>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`alert alert-${alert.severity || "warning"}`}
                >
                  <strong>
                    {alert.type.replace(/_/g, " ").toUpperCase()}:
                  </strong>{" "}
                  {JSON.stringify(alert.details)}
                </div>
              ))}
            </div>
          )}
          <div className="admin-stats">
            <div className="stat-card">
              <strong>{safeOverview.totalUsers}</strong>
              <span>Usuarios Totales</span>
            </div>
            <div className="stat-card">
              <strong>{safeOverview.totalWorkers}</strong>
              <span>Trabajadores</span>
            </div>
            <div className="stat-card">
              <strong>{safeOverview.totalHires}</strong>
              <span>Contrataciones</span>
            </div>
            <div className="stat-card">
              <strong>{safeOverview.dau}</strong>
              <span>Usuarios Activos (24h)</span>
            </div>
            <div className="stat-card">
              <strong>{safeOverview.activeSubscriptions}</strong>
              <span>Suscripciones Activas</span>
            </div>
            <div className="stat-card">
              <strong>${safeOverview.mrr}</strong>
              <span>Ingresos Mensuales (ARS)</span>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Crecimiento semanal</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyGrowthData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Nuevos" fill="#4a9d9c" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Distribución de roles</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* === Pestaña: Métricas === */}
      {activeTab === "metrics" && metricsData && (
        <div className="admin-content">
          <h3>Uso de la API (últimos 14 días)</h3>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apiUsageData}>
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Llamadas"
                  stroke="#4a9d9c"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Error %"
                  stroke="#e74c3c"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* === Pestaña: Suscripciones === */}
      {activeTab === "subscriptions" && (
        <div className="admin-content">
          <h3>Métricas de Suscripciones</h3>
          <div className="admin-stats">
            <div className="stat-card">
              <strong>{safeOverview.activeSubscriptions}</strong>
              <span>Suscripciones Activas</span>
            </div>
            <div className="stat-card">
              <strong>${safeOverview.mrr}</strong>
              <span>Ingresos Mensuales (ARS)</span>
            </div>
            <div className="stat-card">
              <strong>{safeOverview.professionalSubs}</strong>
              <span>Plan Profesional</span>
            </div>
            <div className="stat-card">
              <strong>{safeOverview.featuredSubs}</strong>
              <span>Plan Destacado</span>
            </div>
          </div>

          <div className="chart-card">
            <h3>Nuevas suscripciones (últimos 30 días)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subscriptionGrowthData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Nuevas" fill="#4a9d9c" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Últimos trabajadores en suscribirse</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {safeSubscriptionData.topWorkers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No hay suscripciones recientes
                    </td>
                  </tr>
                ) : (
                  safeSubscriptionData.topWorkers.map((sub) => (
                    <tr key={sub._id}>
                      <td>{sub.name}</td>
                      <td>{sub.email}</td>
                      <td>
                        {sub.plan === "professional"
                          ? "Profesional"
                          : "Destacado"}
                      </td>
                      <td>
                        {new Date(sub.createdAt).toLocaleDateString("es-AR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === Pestaña: Usuarios === */}
      {activeTab === "users" && (
        <div className="admin-content">
          <div className="user-filters">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="role-filter"
            >
              <option value="all">Todos los roles</option>
              <option value="user">Usuarios</option>
              <option value="worker">Trabajadores</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usersData.users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No hay usuarios
                  </td>
                </tr>
              ) : (
                usersData.users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.role === "worker"
                        ? "Trabajador"
                        : user.role === "user"
                        ? "Usuario"
                        : user.role === "admin"
                        ? "Admin"
                        : "Superadmin"}
                    </td>
                    <td>
                      {user.isActive === false ? (
                        <span style={{ color: "red" }}>Suspendido</span>
                      ) : (
                        <span style={{ color: "green" }}>Activo</span>
                      )}
                    </td>
                    <td>
                      {user.lastSeen
                        ? new Date(user.lastSeen).toLocaleDateString()
                        : "Nunca"}
                    </td>
                    <td>
                      <button
                        onClick={() => openUserModal(user)}
                        className="btn-view"
                      >
                        Ver/Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {usersData.total > 0 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(usersData.page - 1)}
                disabled={usersData.page === 1}
              >
                Anterior
              </button>
              <span>
                Página {usersData.page} de {usersData.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(usersData.page + 1)}
                disabled={usersData.page >= usersData.totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* === Pestaña: Infraestructura === */}
      {activeTab === "infra" && (
        <div className="admin-content">
          <h3>Métricas de Infraestructura</h3>
          <div className="infra-stats">
            <div className="infra-card">
              <h4>Memoria (MB)</h4>
              <p>
                RSS: <strong>{safeOverview.infra.memory.rss}</strong>
              </p>
              <p>
                Heap Usado:{" "}
                <strong>{safeOverview.infra.memory.heapUsed}</strong>
              </p>
            </div>
            <div className="infra-card">
              <h4>Tiempo de actividad</h4>
              <p>
                {Math.floor(safeOverview.infra.uptime / 3600)}h{" "}
                {Math.floor(safeOverview.infra.uptime / 60) % 60}m
              </p>
            </div>
            <div className="infra-card">
              <h4>Entorno</h4>
              <p>{safeOverview.infra.env}</p>
              <p>Node: {safeOverview.infra.nodeVersion}</p>
            </div>
          </div>
        </div>
      )}

      {/* === Modal de Gestión de Usuario === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Usuario"
        size="md"
        closeOnEscape={true}
        closeOnOverlayClick={true}
      >
        {modalLoading ? (
          <p>Cargando...</p>
        ) : (
          <div className="user-edit-form">
            {/* Campos comunes */}
            <div className="modal-field">
              <label>Nombre</label>
              <input
                type="text"
                value={userForm.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label>Email</label>
              <input
                type="email"
                value={userForm.email || ""}
                onChange={(e) => handleFormChange("email", e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label>Rol</label>
              <select
                value={userForm.role || "user"}
                onChange={(e) => handleFormChange("role", e.target.value)}
              >
                <option value="user">Usuario</option>
                <option value="worker">Trabajador</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            <div className="modal-field">
              <label>Estado</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={userForm.isActive !== false}
                  onChange={(e) =>
                    handleFormChange("isActive", e.target.checked)
                  }
                />
                <label htmlFor="isActive">
                  {userForm.isActive !== false ? "Activo" : "Suspendido"}
                </label>
              </div>
            </div>

            <div className="modal-field">
              <label>Verificado</label>
              <input
                type="checkbox"
                checked={userForm.isVerified || false}
                onChange={(e) =>
                  handleFormChange("isVerified", e.target.checked)
                }
              />
            </div>

            <div className="modal-field">
              <label>Suscripción</label>
              <select
                value={userForm.subscriptionTier || "none"}
                onChange={(e) =>
                  handleFormChange("subscriptionTier", e.target.value)
                }
              >
                <option value="none">Ninguna</option>
                <option value="professional">Profesional</option>
                <option value="featured">Destacado</option>
              </select>
            </div>

            {/* Campos específicos para worker */}
            {userForm.role === "worker" && (
              <div className="modal-field">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label>Servicios</label>
                  <button
                    type="button"
                    className="btn-add-service"
                    onClick={addService}
                  >
                    + Añadir
                  </button>
                </div>
                {(userForm.services || []).map((service, idx) => (
                  <div
                    key={idx}
                    className="service-item"
                    style={{
                      marginTop: "0.8rem",
                      padding: "0.8rem",
                      background: "#f9f9f9",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      className="modal-field"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <label>Profesión</label>
                      <select
                        value={service.profession || ""}
                        onChange={(e) =>
                          handleServiceChange(idx, "profession", e.target.value)
                        }
                      >
                        {PROFESSIONS.map((prof) => (
                          <option key={prof} value={prof}>
                            {prof.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      className="modal-field"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <label>Tarifa horaria (ARS)</label>
                      <input
                        type="number"
                        value={service.hourlyRate || 0}
                        onChange={(e) =>
                          handleServiceChange(
                            idx,
                            "hourlyRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div
                      className="modal-field"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <label>Biografía (máx. 300)</label>
                      <textarea
                        value={service.bio || ""}
                        onChange={(e) =>
                          handleServiceChange(idx, "bio", e.target.value)
                        }
                        maxLength={300}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                        }}
                      />
                    </div>
                    <div className="modal-field">
                      <label>
                        <input
                          type="checkbox"
                          checked={service.isActive !== false}
                          onChange={(e) =>
                            handleServiceChange(
                              idx,
                              "isActive",
                              e.target.checked
                            )
                          }
                        />
                        Servicio activo
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-service"
                      onClick={() => removeService(idx)}
                      style={{
                        marginTop: "0.5rem",
                        color: "#e74c3c",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Eliminar servicio
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Acciones */}
            <div className="modal-actions">
              <button
                className="btn-delete"
                onClick={deleteUser}
                style={{
                  background: "#e74c3c",
                  border: "none",
                  color: "white",
                }}
              >
                Eliminar usuario
              </button>

              {isDirty && (
                <button
                  className="btn-primary"
                  onClick={saveUserChanges}
                  disabled={modalLoading}
                >
                  {modalLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              )}

              <button
                className="btn-secondary"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "white",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
