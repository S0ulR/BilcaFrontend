// src/pages/AuthCallback.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, token);
        navigate('/dashboard', { replace: true });
      } catch (e) {
        console.error('Error al parsear usuario:', e);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, login]);

  return <div>Autenticando...</div>;
};

export default AuthCallback;
