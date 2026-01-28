import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Vote, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if the path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A]/80 to-[#1E3A8A]/60 text-white shadow-lg z-50 font-['Poppins']">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 md:flex-none flex-1 justify-center md:justify-start">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <Vote className="w-8 h-8 text-[#1E3A8A] animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                  Sri Lanka Voter Hub
                </span>
                <span className="text-xs text-white/80 font-light">Empowering Democratic Participation</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`relative group transition-all duration-300 ${isActive('/') ? 'text-[#FFD700]' : 'text-white'}`}>
              <span className="relative text-lg hover:text-[#FFE082] transition-colors duration-300 font-medium">
                Home
              </span>
            </Link>
            <Link to="/results" className={`relative group transition-all duration-300 ${isActive('/results') ? 'text-[#FFD700]' : 'text-white'}`}>
              <span className="relative text-lg hover:text-[#FFE082] transition-colors duration-300 font-medium">
                Results
              </span>
            </Link>
            <Link to="/about" className={`relative group transition-all duration-300 ${isActive('/about') ? 'text-[#FFD700]' : 'text-white'}`}>
              <span className="relative text-lg hover:text-[#FFE082] transition-colors duration-300 font-medium">
                About
              </span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="relative group transition-all duration-300">
                  <span className="relative text-lg text-white hover:text-[#FFD700] transition-colors duration-300 font-medium">
                    Admin Panel
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-white hover:text-[#FFD700] transition-colors duration-300 text-lg font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-[#FFD700] to-[#FBC02D] text-black rounded-full hover:from-[#FBC02D] hover:to-[#FFD700] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-lg border border-white/20"
              >
                Admin Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-md transition-colors duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-white/95 rounded-lg shadow-xl">
            <div className="flex flex-col space-y-4 px-4">
              <Link 
                to="/" 
                className={`text-lg font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-[#1E3A8A]/10 ${isActive('/') ? 'text-[#FFD700]' : 'text-[#1E3A8A] hover:text-[#1E3A8A]'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/results" 
                className={`text-lg font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-[#1E3A8A]/10 ${isActive('/results') ? 'text-[#FFD700]' : 'text-[#1E3A8A] hover:text-[#1E3A8A]'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Results
              </Link>
              <Link 
                to="/about" 
                className={`text-lg font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-[#1E3A8A]/10 ${isActive('/about') ? 'text-[#FFD700]' : 'text-[#1E3A8A] hover:text-[#1E3A8A]'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/admin" 
                    className="text-lg font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-[#1E3A8A]/10 text-[#1E3A8A] hover:text-[#1E3A8A]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-lg font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:bg-[#1E3A8A]/10 text-[#1E3A8A] hover:text-[#1E3A8A] w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FFD700] to-[#FBC02D] text-black rounded-full hover:from-[#FBC02D] hover:to-[#FFD700] transition-all duration-300 font-semibold shadow-lg text-center hover:scale-105"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;