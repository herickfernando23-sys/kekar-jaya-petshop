import { Apple, Box, Home } from 'lucide-react';

export function CategoryHighlights() {
  const categories = [
    {
      icon: Apple,
      title: 'Makanan Kucing',
      description: 'Makanan premium dan bergizi untuk kucing kesayangan',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    },
    {
      icon: Box,
      title: 'Pasir Kucing',
      description: 'Pasir kucing berkualitas dengan daya serap tinggi',
      gradient: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
    },
    {
      icon: Home,
      title: 'Kandang Kucing',
      description: 'Kandang dan carrier yang aman dan nyaman',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #7c3aed 100%)',
    },
  ];

  const scrollToCatalog = () => {
    const element = document.getElementById('catalog');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="section-band section-band-candy py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 data-reveal className="reveal-on-scroll text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Kategori Produk
          </h2>
          <p data-reveal className="reveal-on-scroll text-gray-600 max-w-2xl mx-auto" style={{ transitionDelay: '90ms' }}>
            Pilihan lengkap produk berkualitas untuk memenuhi semua kebutuhan kucing Anda
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={scrollToCatalog}
              data-reveal
              className="reveal-on-scroll group rounded-2xl p-8 transition-all transform hover:-translate-y-2 text-left"
              style={{
                transitionDelay: `${index * 90}ms`,
                backgroundColor: '#ffffff',
                border: '1px solid #fdba74',
                boxShadow: '0 18px 34px rgba(15, 23, 42, 0.1)'
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background: category.gradient }}>
                <category.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {category.title}
              </h3>
              <p className="text-gray-600">
                {category.description}
              </p>
              <p className="mt-4 text-sm font-semibold" style={{ color: '#ea580c' }}>
                Jelajahi produk →
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
