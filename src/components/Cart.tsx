import React from 'react';
import { useCart } from './CartContext';
import { MessageCircle, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Cart() {
  const { cart, removeFromCart, updateQuantity, getTotalItems, getTotalPrice, clearCart, finalizeCheckoutClearCart } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCheckoutReviewOpen, setIsCheckoutReviewOpen] = React.useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);
  const notificationTimeoutRef = React.useRef<number | null>(null);
  const apiBaseUrl = (((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:5000')
    .replace(/\/+$/, '');
  const CHECKOUT_DUPLICATE_WINDOW_MS = 90_000;
  const LAST_CHECKOUT_SENT_AT_KEY = 'lastCheckoutSentAt';
  const LAST_CHECKOUT_FINGERPRINT_KEY = 'lastCheckoutFingerprint';

  const parsePrice = (price: string) => parseInt(price.replace(/[^\d]/g, ''), 10) || 0;
  const shortenText = (value: string, maxLength = 42) => (
    value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
  );

  const generateCheckoutToken = () => {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const randomParts = new Uint32Array(2);
      window.crypto.getRandomValues(randomParts);
      return `${Date.now()}-${randomParts[0].toString(36)}${randomParts[1].toString(36)}`;
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const buildCheckoutFingerprint = () => (
    cart
      .map((item) => [item.id, item.variantId ?? '', item.variant ?? '', item.quantity, parsePrice(item.price)].join(':'))
      .sort()
      .join('|')
  );

  const showCheckoutNotification = (message: string, duration = 3500) => {
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    setNotification(message);
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, duration);
  };

  const handleCheckoutWhatsApp = async () => {
    if (cart.length === 0) return;

    if (isSubmittingCheckout) {
      return;
    }

    const checkoutFingerprint = buildCheckoutFingerprint();
    const lastCheckoutSentAt = Number(localStorage.getItem(LAST_CHECKOUT_SENT_AT_KEY) || 0);
    const lastCheckoutFingerprint = localStorage.getItem(LAST_CHECKOUT_FINGERPRINT_KEY);

    if (
      lastCheckoutFingerprint === checkoutFingerprint &&
      lastCheckoutSentAt > 0 &&
      Date.now() - lastCheckoutSentAt < CHECKOUT_DUPLICATE_WINDOW_MS
    ) {
      showCheckoutNotification('Pesanan yang sama baru saja dikirim. Tunggu sebentar sebelum mengirim ulang.');
      return;
    }

    setIsSubmittingCheckout(true);

    const checkoutToken = generateCheckoutToken();

    // Simpan order ke backend supaya admin bisa konfirmasi pembayaran dan memotong stok.
    const orderPayload = {
      items: cart.map(item => ({
        product_id: item.id,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        price: parsePrice(item.price),
        name: item.name,
        variant: item.variant || null
      })),
      checkoutToken
    };

    const orderRequest = fetch(`${apiBaseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const itemsText = cart
      .map((item, index) => {
        const subtotal = parsePrice(item.price) * item.quantity;
        const subtotalText = `Rp ${subtotal.toLocaleString('id-ID')}`;
        return `${index + 1}. ${item.name}${item.variant ? ` (${item.variant})` : ''}\n   Harga: ${item.price}\n   Jumlah: ${item.quantity}\n   Subtotal: ${subtotalText}`;
      })
      .join('\n\n');

    const message = encodeURIComponent(
      `Halo Toko Kekar Jaya, saya ingin order produk berikut:\n\n${itemsText}\n\nTotal Harga: ${getTotalPrice()}\n\nMohon diproses, saya menunggu konfirmasi dari admin.\n\nTerima kasih.`
    );

    window.open(`https://wa.me/6282284526105?text=${message}`, '_blank');

    void orderRequest
      .then(async (response) => {
        if (!response.ok) {
          let errorMessage = 'Gagal menyimpan pesanan.';
          try {
            const errorBody = await response.json();
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch {
            // Keep default message when response is not JSON.
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (data && data.orderId) {
          localStorage.setItem('lastOrderId', String(data.orderId));
          localStorage.setItem(LAST_CHECKOUT_SENT_AT_KEY, String(Date.now()));
          localStorage.setItem(LAST_CHECKOUT_FINGERPRINT_KEY, checkoutFingerprint);
        }
      })
      .catch((error: any) => {
        showCheckoutNotification(
          error?.message === 'Duplicate checkout detected'
            ? 'Pesanan yang sama baru saja dibuat. Tunggu sebentar sebelum kirim ulang.'
            : 'Pesanan WA terkirim, tetapi penyimpanan order gagal. Cek koneksi lalu coba lagi.',
          4200
        );
      })
      .finally(() => {
        setIsSubmittingCheckout(false);
      });

    showCheckoutNotification('Pesan WA terkirim. Tunggu konfirmasi admin untuk proses stok.');
  };

  React.useEffect(() => {
    const handleCartNotify = (event: Event) => {
      const customEvent = event as CustomEvent<{ productName?: string; quantity?: number; autoOpen?: boolean }>;
      const productName = customEvent.detail?.productName ?? 'Produk';
      const quantity = customEvent.detail?.quantity ?? 1;
      const shouldAutoOpen = customEvent.detail?.autoOpen ?? false;

      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current);
      }

      if (shouldAutoOpen) {
        setIsOpen(true);
      }

      setNotification(`Ditambahkan: ${shortenText(productName, 30)} (x${quantity})`);
      notificationTimeoutRef.current = window.setTimeout(() => {
        setNotification(null);
      }, 3200);
    };

    window.addEventListener('cart-notify', handleCartNotify as EventListener);

    return () => {
      window.removeEventListener('cart-notify', handleCartNotify as EventListener);
      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Floating Cart Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/50 transition-all z-50 group"
        style={{ right: '50px', top: '5px', backgroundColor: '#f97316' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Buka keranjang"
      >
        <ShoppingCart className="w-7 h-7 text-white" />
        {getTotalItems() > 0 && (
          <span
            className="absolute text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg"
            style={{ 
              top: '-10px', 
              right: '-10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              fontSize: '12px',
              fontWeight: '700'
            }}
          >
            {getTotalItems()}
          </span>
        )}

        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-orange-600 animate-ping opacity-20"></span>
      </motion.button>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl border bg-white/95 backdrop-blur text-gray-800 whitespace-pre-line"
            style={{
              top: '120px',
              zIndex: 99,
              borderColor: '#86efac',
              maxWidth: '360px',
              width: 'calc(100% - 2rem)',
              right: '24px',
              left: 'auto',
            }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-[2px]"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.42)', zIndex: 98 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Cart Panel */}
            <motion.div
              initial={{ opacity: 0, x: -18, y: 18 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -18, y: 18 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed bg-white/95 backdrop-blur rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
              style={{
                right: '14px',
                top: '84px',
                width: 'min(420px, calc(100vw - 28px))',
                maxHeight: 'calc(100vh - 96px)',
                zIndex: 99,
                borderColor: '#fed7aa'
              }}
            >
              {/* Header */}
              <div
                className="flex items-start justify-between pt-6 pb-5 pl-6 pr-5 border-b"
                style={{ borderColor: '#ffedd5', backgroundColor: '#fff7ed' }}
              >
                <div>
                  <h2 className="text-xl leading-tight font-bold text-gray-900">Keranjang Belanja</h2>
                  <p className="text-sm text-gray-500 mt-1">{getTotalItems()} item dipilih</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-white border border-orange-100 text-gray-500 hover:text-gray-700 hover:border-orange-200 shadow-sm flex items-center justify-center leading-none"
                  aria-label="Tutup keranjang"
                >
                  ✕
                </button>
              </div>

              {/* Cart Items */}
              <div
                className="p-5 overflow-y-auto"
                style={{
                  overflowY: 'auto',
                  maxHeight: cart.length > 0 ? 'calc(100vh - 300px)' : 'calc(100vh - 210px)',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  touchAction: 'pan-y'
                }}
              >
                {cart.length === 0 ? (
                  <div className="text-center py-10 px-3">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10 text-orange-300" />
                    </div>
                    <p className="text-gray-700 font-semibold">Keranjang masih kosong</p>
                    <p className="text-sm text-gray-500 mt-1">Yuk tambahkan produk favoritmu dulu.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.variant}`} className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-orange-100 shadow-sm">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-contain rounded-xl bg-white border border-gray-100"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                            {item.name}
                            {item.variant && <span className="text-gray-600"> ({item.variant})</span>}
                          </h3>
                          <p className="text-orange-600 font-bold text-sm mt-1">{item.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                              className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 text-center font-semibold text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                              className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Subtotal: Rp {(parsePrice(item.price) * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.variant)}
                          className="w-8 h-8 rounded-full bg-white border border-red-100 text-red-500 hover:text-red-700 hover:border-red-200 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t p-5 pb-6 bg-white shrink-0" style={{ borderColor: '#ffedd5' }}>
                  <div className="flex justify-between items-center mb-4 p-3 rounded-2xl bg-orange-50/70 border border-orange-100">
                    <span className="text-sm font-semibold text-gray-700">Total Harga</span>
                    <span className="text-xl font-bold text-orange-600">{getTotalPrice()}</span>
                  </div>
                  <div className="flex items-stretch gap-3">
                    <button
                      onClick={clearCart}
                      className="flex-1 bg-gray-100 border border-gray-200 text-gray-700 min-h-11 px-3 py-2.5 rounded-xl font-semibold leading-normal hover:bg-gray-200 transition-colors"
                    >
                      Kosongkan
                    </button>
                    <button
                      onClick={() => setIsCheckoutReviewOpen(true)}
                      className="flex-1 bg-green-500 text-white min-h-11 px-3 py-2.5 rounded-xl font-semibold leading-normal hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Order Now
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutReviewOpen && cart.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-[2px]"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.52)', zIndex: 100 }}
              onClick={() => setIsCheckoutReviewOpen(false)}
            />

            <div className="fixed inset-0 flex items-center justify-center p-3" style={{ zIndex: 101 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full bg-white rounded-3xl shadow-2xl border overflow-hidden flex flex-col"
                style={{
                  width: 'min(560px, calc(100vw - 24px))',
                  maxHeight: 'calc(100vh - 24px)',
                  borderColor: '#fed7aa',
                }}
              >
              <div
                className="px-6 py-5 border-b"
                style={{
                  borderColor: '#ffedd5',
                  background: 'linear-gradient(135deg, #fff7ed 0%, #fffaf4 100%)',
                }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  Konfirmasi sebelum kirim
                </div>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">Konfirmasi Pesanan</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Pesanan akan disimpan setelah Anda menekan tombol konfirmasi.
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700">Total Item</div>
                  <div className="text-2xl font-extrabold text-amber-700">{getTotalItems()}</div>
                </div>

                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={`review-${item.id}-${item.variant}`} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 p-4 shadow-sm bg-white">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 leading-snug">
                          {item.name}
                          {item.variant && <span className="text-gray-600"> ({item.variant})</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Jumlah: {item.quantity}</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        Rp {(parsePrice(item.price) * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-orange-50 border border-orange-100 px-4 py-4 flex items-center justify-between gap-4 shadow-sm">
                  <span className="text-sm font-semibold text-gray-700">Total Harga</span>
                  <span className="text-lg font-extrabold text-orange-600">{getTotalPrice()}</span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  Pastikan pesanan sudah benar sebelum menekan tombol konfirmasi.
                </p>
              </div>

              <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: '#ffedd5', backgroundColor: '#fffdf8' }}>
                <button
                  type="button"
                  onClick={() => setIsCheckoutReviewOpen(false)}
                  className="flex-1 min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsCheckoutReviewOpen(false);
                    await handleCheckoutWhatsApp();
                  }}
                  disabled={isSubmittingCheckout}
                  className="flex-1 min-h-11 rounded-xl bg-green-500 px-4 py-2.5 font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingCheckout ? 'Memproses...' : 'Konfirmasi & Kirim ke WhatsApp'}
                </button>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}