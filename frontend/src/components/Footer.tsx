import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Home, BarChart2, Info, Vote } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A]/80 to-[#1E3A8A]/60 text-white py-8 mt-4 font-['Poppins']">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Vote className="w-7 h-7 text-[#1E3A8A] animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">Sri Lanka Voter Hub</span>
            </div>
            <p className="text-white/90 text-sm">
              Providing transparent and accessible election data for Sri Lanka's local government elections.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-white">Quick Links</h3>
            <ul className="flex justify-center space-x-6">
              <li>
                <Link to="/" className="flex items-center space-x-1 text-white/90 hover:text-[#FFE082] transition-colors">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/results" className="flex items-center space-x-1 text-white/90 hover:text-[#FFE082] transition-colors">
                  <BarChart2 className="w-4 h-4" />
                  <span>Results</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="flex items-center space-x-1 text-white/90 hover:text-[#FFE082] transition-colors">
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-white">Official Resources</h3>
            <div>
              <a
                href="https://elections.gov.lk/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 text-white/90 hover:text-[#FFE082] transition-colors group"
              >
                <ExternalLink className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Election Commission of Sri Lanka</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-6 pt-4 text-center text-white/80 text-sm">
          <p>&copy; {new Date().getFullYear()} Sri Lanka Voter Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;