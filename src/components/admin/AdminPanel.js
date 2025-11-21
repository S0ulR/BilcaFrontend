import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await API.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await API.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error al cargar estadísticas');
    }
  };

  const handleUpdate = async (id, field, value) => {
    try {
      await API.put(`/api/admin/users/${id}`, { [field]: value });
      loadUsers(); // Refrescar
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  if (loading) return <p>Cargando panel de administrador...</p>;

  return (
    <div className="admin-panel">
      <h2>Panel de Administrador</h2>

      <div className="admin-stats">
        <div className="stat-card"><strong>{stats.totalUsers}</strong> Usuarios</div>
        <div className="stat-card"><strong>{stats.totalWorkers}</strong> Trabajadores</div>
        <div className="stat-card"><strong>{stats.totalHires}</strong> Contrataciones</div>
        <div className="stat-card"><strong>{stats.pendingHires}</strong> Pendientes</div>
      </div>

      <h3>Usuarios</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Verificado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleUpdate(user._id, 'role', e.target.value)}
                >
                  <option value="user">Usuario</option>
                  <option value="worker">Trabajador</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={user.isVerified || false}
                  onChange={(e) => handleUpdate(user._id, 'isVerified', e.target.checked)}
                />
              </td>
              <td>
                <button
                  onClick={() => handleUpdate(user._id, 'isVerified', !user.isVerified)}
                  className="btn-verify"
                >
                  {user.isVerified ? 'Desverificar' : 'Verificar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
