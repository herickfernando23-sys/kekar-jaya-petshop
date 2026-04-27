import React from 'react';
import { useCart } from './CartContext';
import { MessageCircle, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Cart() {
  const { cart, removeFromCart, updateQuantity, getTotalItems, getTotalPrice, clearCart, finalizeCheckoutClearCart } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);
  const notificationTimeoutRef = React.useRef<number | null>(null);
  const confirmationHandledRef = React.useRef(false);

  const PENDING_CHECKOUT_TOKEN_KEY = 'pendingCheckoutToken';

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

  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    const checkoutToken = generateCheckoutToken();
    localStorage.setItem(PENDING_CHECKOUT_TOKEN_KEY, checkoutToken);

    // Kirim order ke backend
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

    fetch('http://localhost:5000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (data && data.orderId) {
          localStorage.setItem('lastOrderId', String(data.orderId));
        }
      })
      .catch(() => {});

    const confirmationLink = `${window.location.origin}${window.location.pathname}?orderConfirm=${checkoutToken}`;

    const itemsText = cart
      .map((item, index) => {
        const subtotal = parsePrice(item.price) * item.quantity;
        const subtotalText = `Rp ${subtotal.toLocaleString('id-ID')}`;
        return `${index + 1}. ${item.name}${item.variant ? ` (${item.variant})` : ''}\n   Harga: ${item.price}\n   Jumlah: ${item.quantity}\n   Subtotal: ${subtotalText}`;
      })
      .join('\n\n');

    const message = encodeURIComponent(
      `Halo Toko Kekar Jaya, saya ingin order produk berikut:\n\n${itemsText}\n\nTotal Harga: ${getTotalPrice()}\n\nMohon konfirmasi pesanan saya.\n\nLink konfirmasi pelanggan (kirim kembali link ini ke saya setelah pesanan disetujui):\n${confirmationLink}\n\nTerima kasih.`
    );

    window.open(`https://wa.me/6282284526105?text=${message}`, '_blank');

    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    setNotification('Pesan WA terkirim. Tunggu link konfirmasi dari toko untuk mengosongkan keranjang.');
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  React.useEffect(() => {
    if (confirmationHandledRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tokenFromLink = params.get('orderConfirm');
    console.log('tokenFromLink', tokenFromLink);
    if (!tokenFromLink) {
      return;
    }

    confirmationHandledRef.current = true;
    const storedToken = localStorage.getItem(PENDING_CHECKOUT_TOKEN_KEY);


    // Ambil orderId dan token dari localStorage
    const confirmOrder = async () => {
      console.log('Memanggil confirmOrder');
      let orderId = localStorage.getItem('lastOrderId');
      let confirmationToken = localStorage.getItem(PENDING_CHECKOUT_TOKEN_KEY);

      // Jika token di URL ada, cari orderId di backend berdasarkan token
      if (tokenFromLink) {
        try {
          const res = await fetch('http://localhost:5000/orders');
          if (res.ok) {
            const orders = await res.json();
            const found = orders.find((o: any) => o.notes === tokenFromLink && o.status === 'pending');
            if (found) {
              orderId = String(found.id);
              confirmationToken = found.notes;
            }
          }
        } catch {}
      }

      if (orderId && confirmationToken && confirmationToken === tokenFromLink) {
        try {
          const res = await fetch(`http://localhost:5000/orders/${orderId}/confirm?token=${encodeURIComponent(confirmationToken)}`, { method: 'POST' });
          if (res.ok) {
            finalizeCheckoutClearCart();
            localStorage.removeItem(PENDING_CHECKOUT_TOKEN_KEY);
            if (notificationTimeoutRef.current !== null) {
              window.clearTimeout(notificationTimeoutRef.current);
            }
            setNotification('Pesanan sudah dikonfirmasi toko. Keranjang otomatis dikosongkan.');
            notificationTimeoutRef.current = window.setTimeout(() => {
              setNotification(null);
              window.location.reload(); // reload agar stok produk/varian langsung update di user & admin
            }, 1500);
          } else {
            setNotification('Link konfirmasi tidak valid atau sudah dipakai.');
            notificationTimeoutRef.current = window.setTimeout(() => {
              setNotification(null);
            }, 3500);
          }
        } catch (e) {
          setNotification('Terjadi error saat konfirmasi.');
          notificationTimeoutRef.current = window.setTimeout(() => {
            setNotification(null);
          }, 3500);
        }
      } else {
        setNotification('Link konfirmasi tidak valid atau sudah dipakai.');
        notificationTimeoutRef.current = window.setTimeout(() => {
          setNotification(null);
        }, 3500);
      }
    };

    if (tokenFromLink) {
      confirmOrder();
    }

    params.delete('orderConfirm');
    const cleanQuery = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', cleanUrl);
  }, [finalizeCheckoutClearCart]);

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
                      onClick={handleCheckoutWhatsApp}
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
    </>
  );
}