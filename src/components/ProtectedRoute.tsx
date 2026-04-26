import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  element: React.ReactNode;
}

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 menit

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const isLoggedIn = localStorage.getItem('adminLoggedIn');
  const loginTimestamp = localStorage.getItem('loginTimestamp');

  // Jika tidak ada login flag
  if (!isLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  // Jika tidak ada timestamp (suspicious - langsung set dari console)
  if (!loginTimestamp) {
    localStorage.removeItem('adminLoggedIn');
    return <Navigate to="/admin" replace />;
  }

  // Check session timeout
  const currentTime = Date.now();
  const lastLoginTime = parseInt(loginTimestamp, 10);
  const elapsed = currentTime - lastLoginTime;

  if (elapsed > SESSION_TIMEOUT) {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('loginTimestamp');
    return <Navigate to="/admin" replace />;
  }

  // Update timestamp setiap kali akses (keep session alive)
  localStorage.setItem('loginTimestamp', currentTime.toString());

  return <>{element}</>;
};
