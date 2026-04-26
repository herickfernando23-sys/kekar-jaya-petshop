import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AnimatedStripeBand } from './components/AnimatedStripeBand';
import { CategoryHighlights } from './components/CategoryHighlights';
import { StoreAdvantages } from './components/StoreAdvantages';
import { About } from './components/About';
import { ProductCatalog } from './components/ProductCatalog';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { CartProvider } from './components/CartContext';
import { Cart } from './components/Cart';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useLocation } from 'react-router-dom';

const HomePage = () => (
  <>
    <Hero />
    <CategoryHighlights />
    <AnimatedStripeBand />
    <StoreAdvantages />
    <AnimatedStripeBand />
    <About />
    <ProductCatalog />
    <Contact />
    <Footer />
    <FloatingWhatsApp />
    <Cart />
  </>
);

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const previousMode = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return () => {
      window.history.scrollRestoration = previousMode;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (revealTargets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -48px 0px',
      }
    );

    revealTargets.forEach((target) => {
      if (target.classList.contains('is-visible')) return;
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} />} />
      </Routes>
    );
  }

  return (
    <div
      className="public-site min-h-screen"
      style={{
        background: 'radial-gradient(circle at 15% -10%, #ffedd5 0%, #fff8f1 35%, #ffffff 68%)',
      }}
    >
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <AppShell />
      </Router>
    </CartProvider>
  );
}
