import { ArrowRight, MessageCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="pt-24 overflow-hidden"
      style={{
        background: '#ffffff',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div
              data-reveal
              className="reveal-on-scroll inline-block px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74' }}
            >
              PET CARE COMMERCE
            </div>
            <h1 data-reveal className="reveal-on-scroll text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight" style={{ transitionDelay: '80ms' }}>
              Premium Petshop Experience
              <span className="block" style={{ color: '#ea580c' }}>Untuk Kucing Kesayangan Anda</span>
            </h1>
            <p data-reveal className="reveal-on-scroll text-lg" style={{ color: '#4b5563', maxWidth: '640px', transitionDelay: '140ms' }}>
              Toko Kekar Jaya menghadirkan produk kurasi terbaik: makanan premium, pasir higienis,
              dan perlengkapan kucing pilihan, dengan pelayanan cepat dan personal via WhatsApp.
            </p>

            <div data-reveal className="reveal-on-scroll flex flex-wrap gap-3 text-sm" style={{ transitionDelay: '190ms' }}>
              <div className="px-4 py-2 rounded-xl bg-white border" style={{ borderColor: '#fed7aa' }}>
                <span className="font-bold text-gray-900">Layanan Cepat</span> setiap hari
              </div>
              <div className="px-4 py-2 rounded-xl bg-white border" style={{ borderColor: '#fed7aa' }}>
                <span className="font-bold text-gray-900">Produk Terpilih</span> kualitas terbaik
              </div>
              <div className="px-4 py-2 rounded-xl bg-white border" style={{ borderColor: '#fed7aa' }}>
                <span className="font-bold text-gray-900">Pelayanan Personal</span> via WhatsApp
              </div>
            </div>
            
            <div data-reveal className="reveal-on-scroll flex flex-col sm:flex-row gap-4 pt-4" style={{ transitionDelay: '250ms' }}>
              <button
                onClick={() => scrollToSection('catalog')}
                className="group inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full transition-all transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 16px 30px rgba(249, 115, 22, 0.3)'
                }}
              >
                Lihat Katalog
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://wa.me/6282284526105?text=Halo%20Toko%20Kekar%20Jaya%2C%20saya%20ingin%20bertanya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white border text-orange-700 px-8 py-4 rounded-full hover:bg-orange-50 transition-all font-semibold"
                style={{ borderColor: '#fdba74' }}
              >
                <MessageCircle className="w-5 h-5" />
                Hubungi via WhatsApp
              </a>
            </div>
          </div>

          {/* Image */}
          <div data-reveal className="reveal-on-scroll relative" style={{ transitionDelay: '120ms' }}>
            <div className="absolute -top-10 -right-8 w-72 h-72 rounded-full blur-3xl opacity-40" style={{ backgroundColor: '#fdba74' }}></div>
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                border: '1px solid rgba(251, 146, 60, 0.35)',
                boxShadow: '0 26px 45px rgba(15, 23, 42, 0.12)'
              }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1720291062255-1aa606aac7e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwaGVhbHRoeSUyMG9yYW5nZSUyMGNhdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDc4NDkwMnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Kucing Sehat dan Bahagia"
                className="w-full h-auto object-cover"
              />
            </div>
            <div
              className="absolute -bottom-5 -left-4 rounded-2xl px-4 py-3 bg-white"
              style={{ border: '1px solid #fed7aa', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)' }}
            >
              <p className="text-xs font-semibold" style={{ color: '#c2410c' }}>Trusted by Cat Lovers</p>
              <p className="text-sm font-bold text-gray-900">Belanja cepat, stok real-time</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}