import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

export function Contact() {
  return (
    <section id="contact" className="section-band section-band-warm py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://img.magnific.com/free-photo/top-view-animal-food-with-paw-print-animal-day_23-2148668905.jpg?t=st=1777911625~exp=1777915225~hmac=30da7559b1ebc161194cfdc8b243ec9a3d5b3c247c76896f72da63a65dfd8eb6&w=2000')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p data-reveal className="reveal-on-scroll text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#ea580c' }}>
            Let&apos;s Connect
          </p>
          <h2 data-reveal className="reveal-on-scroll text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ transitionDelay: '80ms' }}>
            Hubungi Kami
          </h2>
          <p data-reveal className="reveal-on-scroll text-gray-600 max-w-2xl mx-auto" style={{ transitionDelay: '140ms' }}>
            Kami siap membantu Anda. Jangan ragu untuk menghubungi kami!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div data-reveal className="reveal-on-scroll">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Informasi Kontak
              </h3>
              
              <div className="space-y-6">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/6282284526105?text=Halo%20Toko%20Kekar%20Jaya%2C%20saya%20ingin%20bertanya"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-reveal
                  className="reveal-on-scroll flex items-start gap-4 p-6 rounded-2xl transition-all group"
                  style={{ border: '1px solid #fdba74', backgroundColor: '#fff7ed', transitionDelay: '80ms' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#22c55e' }}>
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">WhatsApp (Preferred)</p>
                    <p className="text-gray-700">+62 822-8452-6105</p>
                    <p className="text-sm text-orange-600 mt-1">Klik untuk chat langsung</p>
                  </div>
                </a>

                {/* Phone */}
                <div data-reveal className="reveal-on-scroll flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', transitionDelay: '140ms' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0ea5e9' }}>
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Telepon</p>
                    <p className="text-gray-700">0822-8452-6105</p>
                  </div>
                </div>

                {/* Email */}
                <div data-reveal className="reveal-on-scroll flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', transitionDelay: '200ms' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}>
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Email</p>
                    <p className="text-gray-700">info@tokokekarjaya.com</p>
                  </div>
                </div>

                {/* Address */}
                <div data-reveal className="reveal-on-scroll flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', transitionDelay: '260ms' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#8b5cf6' }}>
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Alamat Toko</p>
                    <p className="text-gray-700">Patam Lestari, Sekupang</p>
                    <p className="text-gray-700">Batam City, Riau Islands</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="space-y-6">
            <div data-reveal className="reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Lokasi Toko
              </h3>
              <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] bg-gray-100">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.6392850467743!2d103.963077!3d1.1101549!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31d98b82dc96269f%3A0x5f131b618d051513!2sKEKAR%20JAYA!5e0!3m2!1sen!2sid!4v1707849032123!5m2!1sen!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi Toko Kekar Jaya"
                ></iframe>
              </div>
            </div>

            {/* Quick CTA */}
            <div
              data-reveal
              className="reveal-on-scroll rounded-2xl p-8 text-white"
              style={{
                transitionDelay: '180ms',
                backgroundColor: '#ea580c',
                boxShadow: '0 18px 32px rgba(234, 88, 12, 0.28)'
              }}
            >
              <h3 className="text-2xl font-bold mb-3">
                Butuh Bantuan Segera?
              </h3>
              <p className="mb-6 text-orange-50">
                Tim kami siap membantu Anda memilih produk terbaik untuk kucing kesayangan Anda.
              </p>
              <a
                href="https://wa.me/6282284526105?text=Halo%20Toko%20Kekar%20Jaya%2C%20saya%20butuh%20bantuan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-all"
                style={{ color: '#ea580c' }}
              >
                <MessageCircle className="w-5 h-5" />
                Chat via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}