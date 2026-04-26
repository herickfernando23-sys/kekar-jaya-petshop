import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";

export function FloatingWhatsApp() {
  return (
    <motion.a
      href="https://wa.me/6282284526105?text=Halo%20Toko%20Kekar%20Jaya%2C%20saya%20ingin%20bertanya"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/50 transition-all z-50 group"
      style={{ backgroundColor: '#25D366' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: [0, -6, 0],
        boxShadow: [
          '0 12px 28px rgba(22, 163, 74, 0.35)',
          '0 16px 36px rgba(22, 163, 74, 0.5)',
          '0 12px 28px rgba(22, 163, 74, 0.35)',
        ],
      }}
      transition={{
        scale: { duration: 0.35, ease: 'easeOut' },
        opacity: { duration: 0.35, ease: 'easeOut' },
        y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
        boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
      }}
      whileHover={{ scale: 1.12, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <MessageCircle className="w-7 h-7 text-white" />

      {/* Pulse Animation */}
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30"></span>

      {/* Label appears only when interacted */}
      <span className="absolute right-full mr-3 px-3 py-2 bg-white text-green-700 text-sm font-semibold rounded-full whitespace-nowrap border border-green-200 shadow-lg pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 group-active:opacity-100 group-active:translate-x-0 transition-all duration-200">
        Chat dengan kami
      </span>
    </motion.a>
  );
}