import { Cat, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className="text-white pt-14 pb-7"
      style={{ backgroundColor: '#111827' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-reveal
          className="reveal-on-scroll grid md:grid-cols-4 gap-8 mb-8 rounded-3xl p-8"
          style={{ border: '1px solid rgba(251, 146, 60, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
        >
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' }}>
                <Cat className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">Toko Kekar Jaya</p>
                <p className="text-xs text-gray-400">Solusi Kebutuhan Kucing</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Toko petshop khusus kucing terpercaya dengan produk berkualitas dan harga terjangkau.
            </p>
          </div>

          {/* Quick Links */}
          <div data-reveal className="reveal-on-scroll" style={{ transitionDelay: '80ms' }}>
            <h3 className="font-bold text-lg mb-4">Link Cepat</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                >
                  Beranda
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                >
                  Tentang Kami
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('catalog')}
                  className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                >
                  Katalog Produk
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                >
                  Kontak
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div data-reveal className="reveal-on-scroll" style={{ transitionDelay: '140ms' }}>
            <h3 className="font-bold text-lg mb-4">Kategori Produk</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('catalog')}
                  className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                >
                  Makanan Kucing
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('catalog')}
                  className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                >
                  Pasir Kucing
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('catalog')}
                  className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                >
                  Kandang Kucing
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div data-reveal className="reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
            <h3 className="font-bold text-lg mb-4">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Patam Lestari, Sekupang, Batam City, Riau Islands</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+62 822-8452-6105</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@tokokekarjaya.com</span>
              </li>
            </ul>
            
            {/* Social Media */}
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Ikuti Kami</p>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.28) 0%, rgba(249,115,22,0.28) 100%)' }}
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.28) 0%, rgba(37,99,235,0.28) 100%)' }}
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div data-reveal className="reveal-on-scroll pt-6 text-center text-sm text-gray-300" style={{ transitionDelay: '120ms' }}>
          <p>&copy; 2026 Toko Kekar Jaya. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}