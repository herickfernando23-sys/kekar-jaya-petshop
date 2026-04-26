import { Cat, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  // Don't show navbar on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed top-4 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex justify-between items-center h-16 rounded-full px-4 sm:px-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(251, 146, 60, 0.24)',
            boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)'
          }}
        >
          {/* Logo */}
          <button 
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #fb923c, #f97316)' }}>
              <Cat className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-lg text-gray-900">Toko Kekar Jaya</span>
              <span className="text-xs" style={{ color: '#f97316', letterSpacing: '0.08em' }}>PETSHOP SPECIALIST</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => scrollToSection('hero')}
              className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors font-medium"
            >
              Beranda
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors font-medium"
            >
              Tentang Kami
            </button>
            <button 
              onClick={() => scrollToSection('catalog')}
              className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors font-medium"
            >
              Katalog
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors font-medium"
            >
              Kontak
            </button>
            <a
              href="https://wa.me/6282284526105?text=Halo%20Toko%20Kekar%20Jaya%2C%20saya%20ingin%20bertanya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white px-6 py-2 rounded-full font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                boxShadow: '0 8px 18px rgba(249, 115, 22, 0.34)',
              }}
            >
              Hubungi Kami
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 rounded-full"
            style={{ backgroundColor: '#fff7ed' }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            className="md:hidden mt-3 py-4 space-y-3 border rounded-2xl"
            style={{
              borderColor: '#fed7aa',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)'
            }}
          >
            <button 
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 rounded font-medium"
            >
              Beranda
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 rounded font-medium"
            >
              Tentang Kami
            </button>
            <button 
              onClick={() => scrollToSection('catalog')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 rounded font-medium"
            >
              Katalog
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 rounded font-medium"
            >
              Kontak
            </button>
            <a
              href="https://wa.me/6282284526105?text=Halo%20Toko%20Kekar%20Jaya%2C%20saya%20ingin%20bertanya"
              target="_blank"
              rel="noopener noreferrer"
              className="block mx-4 text-center text-white px-6 py-2 rounded-full font-semibold"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            >
              Hubungi Kami
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}