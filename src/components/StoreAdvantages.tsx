import { Award, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';

export function StoreAdvantages() {
  const advantages = [
    {
      icon: Award,
      title: 'Produk Berkualitas',
      description: 'Hanya menyediakan produk terbaik dan terpercaya untuk kucing Anda',
      gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
    },
    {
      icon: DollarSign,
      title: 'Harga Terjangkau',
      description: 'Harga kompetitif dengan kualitas terjamin',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
    {
      icon: MessageSquare,
      title: 'Fast Response WhatsApp',
      description: 'Tim kami siap melayani dengan cepat dan ramah',
      gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    },
    {
      icon: TrendingUp,
      title: 'Berpengalaman',
      description: 'Melayani pecinta kucing sejak bertahun-tahun',
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    },
  ];

  return (
    <section className="section-band section-band-plain py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 data-reveal className="reveal-on-scroll text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Mengapa Pilih Kami?
          </h2>
          <p data-reveal className="reveal-on-scroll text-gray-600 max-w-2xl mx-auto" style={{ transitionDelay: '90ms' }}>
            Kepercayaan dan kepuasan pelanggan adalah prioritas utama kami
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {advantages.map((advantage, index) => (
            <div
              key={index}
              data-reveal
              className="reveal-on-scroll text-center space-y-4 p-6 rounded-2xl transition-all"
              style={{
                transitionDelay: `${index * 80}ms`,
                backgroundColor: '#ffffff',
                border: '1px solid #fdba74',
                boxShadow: '0 14px 26px rgba(15, 23, 42, 0.08)'
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: advantage.gradient }}>
                <advantage.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {advantage.title}
              </h3>
              <p className="text-gray-600">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
