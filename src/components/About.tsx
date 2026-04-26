import { Clock, MapPin, Target } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function About() {
  return (
    <section id="about" className="section-band section-band-warm py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p data-reveal className="reveal-on-scroll text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#ea580c' }}>
            About Our Brand
          </p>
          <h2 data-reveal className="reveal-on-scroll text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ transitionDelay: '80ms' }}>
            Tentang Toko Kekar Jaya
          </h2>
          <p data-reveal className="reveal-on-scroll text-gray-600 max-w-2xl mx-auto" style={{ transitionDelay: '140ms' }}>
            Partner terpercaya dalam merawat kucing kesayangan Anda
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Image */}
          <div
            data-reveal
            className="relative rounded-3xl overflow-hidden"
            style={{ border: '1px solid #fed7aa', boxShadow: '0 22px 40px rgba(15, 23, 42, 0.1)', transitionDelay: '80ms' }}
          >
            <ImageWithFallback
              src="/images/tokokekarjaya.jpg"
              alt="Toko Kekar Jaya"
              className="w-full h-[300px] object-cover"
            />
          </div>

          {/* Content */}
          <div data-reveal className="reveal-on-scroll space-y-6" style={{ transitionDelay: '140ms' }}>
            <h3 className="text-2xl font-bold text-gray-900">
              Cerita Kami
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Toko Kekar Jaya adalah toko petshop khusus kucing yang telah melayani para pecinta kucing 
              dengan dedikasi penuh. Kami memahami bahwa kucing adalah bagian penting dari keluarga Anda, 
              oleh karena itu kami berkomitmen untuk menyediakan produk-produk berkualitas tinggi dengan 
              harga yang terjangkau.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Dengan pengalaman bertahun-tahun, kami telah membangun kepercayaan dengan ribuan pelanggan 
              setia. Tim kami siap memberikan rekomendasi terbaik untuk kebutuhan kucing Anda.
            </p>

            {/* Location & Hours */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' }}
                >
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Alamat:</p>
                  <p className="text-gray-700">Patam Lestari, Sekupang</p>
                  <p className="text-gray-700">Batam City, Riau Islands</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
                >
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Jam Operasional:</p>
                  <p className="text-gray-700">Senin - Sabtu: 09.00 - 20.00 WIB</p>
                  <p className="text-gray-700">Minggu: 10.00 - 18.00 WIB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-8">
          <div data-reveal className="reveal-on-scroll rounded-2xl p-8" style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)', transitionDelay: '80ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Visi</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Menjadi toko petshop kucing terpercaya dan terdepan dalam menyediakan produk berkualitas 
              tinggi serta pelayanan terbaik untuk kesejahteraan kucing di Indonesia.
            </p>
          </div>

          <div data-reveal className="reveal-on-scroll rounded-2xl p-8" style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)', transitionDelay: '160ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)' }}>
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Misi</h3>
            </div>
            <ul className="text-gray-700 leading-relaxed space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Menyediakan produk berkualitas dengan harga terjangkau</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Memberikan pelayanan terbaik dan responsif</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Edukasi perawatan kucing yang baik dan benar</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}