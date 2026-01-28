import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // For demo purposes, we'll use a simple hardcoded admin credential
  // In a real application, this would be handled securely on the server
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple admin authentication for demo
    if (username === 'admin' && password === 'admin123') {
      login();
      navigate('/admin');
    } else {
      setError('Invalid credentials. Use admin/admin123 for demo.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <form className="mt-8 space-y-8 bg-white p-12 rounded-xl shadow-lg border border-gray-200" onSubmit={handleLogin}>
          <div className="rounded-md space-y-6">
            <div className="mb-8">
              <h2 className="text-center text-4xl font-bold text-gray-900 font-poppins mb-4">
                Admin Login
              </h2>
              <p className="mt-4 text-center text-base text-gray-600 font-poppins">
                Please sign in to access the admin panel
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 font-poppins mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-4 py-4 pl-12 font-poppins border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#074799] focus:border-[#074799] text-base"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-poppins mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-4 pl-12 pr-12 font-poppins border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#074799] focus:border-[#074799] text-base"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-poppins">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-[#074799] hover:bg-[#0a3d7c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#074799] font-poppins transition-colors duration-200"
              >
                Sign in
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;