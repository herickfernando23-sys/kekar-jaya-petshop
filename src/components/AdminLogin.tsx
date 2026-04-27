import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username.trim() === 'admin' && password === 'jaya2024') {
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('loginTimestamp', Date.now().toString());
      navigate('/admin/dashboard');
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-100 px-4">
      <div className="w-full rounded-3xl border border-orange-100 bg-white p-8 shadow-2xl" style={{ maxWidth: '480px' }}>
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Admin Access</p>
          <h2 className="mt-2 text-3xl font-black text-gray-900">Admin Kekar Jaya</h2>
          <p className="mt-3 text-sm text-gray-600">Masuk untuk mengelola stok produk, varian, dan katalog.</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm" style={{ color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 pr-10 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 pointer-events-auto"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-orange-600 py-2.5 font-semibold text-black hover:bg-orange-700 hover:shadow-md active:bg-orange-800 transition duration-200 focus:outline-none border border-orange-700"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
