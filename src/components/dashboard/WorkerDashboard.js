// src/components/dashboard/WorkerDashboard.js
import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import { useAuth } from "../../context/AuthProvider"; // Nuevo
import API from "../../services/api";
import StarRating from "../ui/StarRating";
import Breadcrumb from "../ui/Breadcrumb";
import "./WorkerDashboard.css";

const WorkerDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalEarnings: 0,
    avgRating: 0,
  });
  const [jobsData, setJobsData] = useState(null); // Inicialmente null
  const [earningsData, setEarningsData] = useState(null); // Inicialmente null
  const [loading, setLoading] = useState(true);

  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación

  useEffect(() => {
    if (!user || user.role !== "worker") return;

    const loadDashboardData = async () => {
      try {
        // Estadísticas generales
        const statsRes = await API.get("/dashboard/stats");
        setStats(statsRes.data);

        // Reseñas
        const reviewsRes = await API.get(`/reviews/workers/${user.id}/reviews`);
        setReviews(reviewsRes.data.slice(0, 3));

        // Datos para gráficas
        const monthlyJobs = Array(6).fill(0);
        const weeklyEarnings = Array(4).fill(0);

        const hiresRes = await API.get("/hires");
        const completedHires = hiresRes.data.filter(
          (h) => h.worker?._id === user.id && h.status === "completado"
        );

        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const recentHires = completedHires.filter((h) => {
          const hireDate = new Date(h.completedAt || h.updatedAt);
          return hireDate >= sixMonthsAgo;
        });

        recentHires.forEach((hire) => {
          const monthIndex = new Date(hire.completedAt || hire.updatedAt).getMonth() - sixMonthsAgo.getMonth();
          if (monthIndex >= 0 && monthIndex < 6) {
            monthlyJobs[monthIndex]++;
          }
        });

        const fourWeeksAgo = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
        const recentEarnings = completedHires.filter((h) => {
          const date = new Date(h.completedAt || h.updatedAt);
          return date >= fourWeeksAgo;
        });

        const weekLabels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
        const earningsPerWeek = weekLabels.map((_, i) => {
          const weekStart = new Date(fourWeeksAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return recentEarnings
            .filter((h) => {
              const date = new Date(h.completedAt || h.updatedAt);
              return date >= weekStart && date < weekEnd;
            })
            .reduce((sum, h) => sum + (h.budget || 0), 0);
        });

        // ✅ Solo establece los datos cuando estén listos
        setJobsData({
          labels: ["Hace 5 meses", "Hace 4", "Hace 3", "Hace 2", "Hace 1", "Este mes"],
          datasets: [
            {
              label: "Trabajos realizados",
              data: monthlyJobs,
              backgroundColor: "#4a9d9c",
              borderColor: "#3a7f7e",
              tension: 0.3,
            },
          ],
        });

        setEarningsData({
          labels: weekLabels,
          datasets: [
            {
              label: "Ingresos ($)",
              data: earningsPerWeek,
              fill: false,
              borderColor: "#ffa726",
              backgroundColor: "#ffa726",
              tension: 0.3,
            },
          ],
        });
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="worker-dashboard">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Dashboard", active: true },
          ]}
        />
        <div className="welcome-card">
          <h1>Cargando tu panel de trabajo...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-dashboard">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Dashboard", active: true },
        ]}
      />

      {/* Encabezado */}
      <div className="welcome-card">
        <h1>Bienvenido, {user?.name} 👷‍♂️</h1>
        <p>
          Aquí están tus estadísticas, reseñas y evolución de trabajos.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Trabajos completados</h3>
          <p>{stats.totalJobs}</p>
        </div>
        <div className="stat-card">
          <h3>Ingresos estimados</h3>
          <p>${stats.totalEarnings.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Valoración promedio</h3>
          <p>⭐ {stats.avgRating.toFixed(1)}</p>
        </div>
      </div>

      {/* Últimas reseñas */}
      <div className="reviews-preview">
        <h3>Últimas reseñas</h3>
        {reviews.length === 0 ? (
          <p className="empty">Aún no tienes reseñas.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <strong>{review.user?.name}</strong>
                <StarRating rating={review.rating} />
              </div>
              <p className="review-comment">
                "{review.comment?.length > 120
                  ? review.comment.slice(0, 120) + "..."
                  : review.comment}"
              </p>
            </div>
          ))
        )}
        {reviews.length > 0 && (
          <button
            className="btn-view-all"
            onClick={() => window.location.href = "/dashboard/reviews"}
          >
            Ver todas las reseñas
          </button>
        )}
      </div>

      {/* Gráficas - Renderizado condicional */}
      <div className="charts">
        <div className="chart-item">
          <h3>Trabajos por mes (últimos 6 meses)</h3>
          {jobsData ? (
            <Bar data={jobsData} options={{ responsive: true, maintainAspectRatio: false }} />
          ) : (
            <p>Cargando gráfica...</p>
          )}
        </div>
        <div className="chart-item">
          <h3>Evolución de ingresos (últimas 4 semanas)</h3>
          {earningsData ? (
            <Line data={earningsData} options={{ responsive: true, maintainAspectRatio: false }} />
          ) : (
            <p>Cargando gráfica...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
