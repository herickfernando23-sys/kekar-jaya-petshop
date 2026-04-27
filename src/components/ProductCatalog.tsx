import { useState, useEffect, useMemo, useRef } from 'react';

// Tambahkan fungsi handleFileChange agar error hilang
function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (file) {
    // Anda bisa menambahkan logika sesuai kebutuhan, misal:
    // console.log('File dipilih:', file.name);
  }
}
import { ChevronDown, MessageCircle, Minus, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCart } from './CartContext';
import { products as localProducts, PRODUCT_STORAGE_KEY, DELETED_PRODUCT_IDS_KEY } from '../data/products';

type ProductVariant = {
  name: string;
  price: string;
  stock?: number;
  image?: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  stock?: number;
  image: string;
  className?: string;
  variants?: ProductVariant[];
};

const ADMIN_CUSTOM_CATEGORIES_KEY = 'adminCustomCategories';
const PAW_PRINT_ICON = 'https://cdn-icons-png.flaticon.com/512/9152/9152624.png';

const getCategoryBadge = (category: string) => {
  if (category === 'Semua Produk') {
    return { icon: PAW_PRINT_ICON, tone: 'bg-orange-100 text-orange-600', isImage: true };
  }

  if (category.toLowerCase().includes('kandang')) {
    return {
      icon: 'https://cdn-icons-png.flaticon.com/512/3048/3048180.png',
      tone: 'bg-sky-100 text-sky-600',
      isImage: true,
    };
  }

  if (category.toLowerCase().includes('makanan')) {
    return {
      icon: 'https://cdn-icons-png.flaticon.com/512/14257/14257455.png',
      tone: 'bg-emerald-100 text-emerald-600',
      isImage: true,
    };
  }

  if (category.toLowerCase().includes('pasir')) {
    return {
      icon: 'https://cdn-icons-png.flaticon.com/512/1687/1687316.png',
      tone: 'bg-cyan-100 text-cyan-600',
      isImage: true,
    };
  }

  return { icon: PAW_PRINT_ICON, tone: 'bg-orange-100 text-orange-600', isImage: true };
};

export function ProductCatalog() {
  const { addToCart, cart } = useCart();
  const catalogRef = useRef<HTMLElement | null>(null);
  const hasMountedPageEffect = useRef(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productSource, setProductSource] = useState<'api' | 'local'>('api');
  const [productLoadNote, setProductLoadNote] = useState('');
  const apiBaseUrl = (((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:5000')
    .replace(/\/+$/, '');
  const itemsPerPage = 9;

  const formatPrice = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

  const isValidStoredProduct = (item: any): boolean => (
    item &&
    typeof item.id === 'number' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.stock === 'number' &&
    typeof item.category === 'string' &&
    typeof item.description === 'string' &&
    typeof item.image === 'string'
  );

  const resolveCategoryName = (categoryId: number, categoryName?: string) => (
    categoryId === 1 ? 'Makanan Kucing' :
    categoryId === 2 ? 'Pasir Kucing' :
    categoryId === 3 ? 'Kandang Kucing' :
    (categoryName ? categoryName : '')
  );

  const mapApiProducts = (data: any[]): Product[] =>
    data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: resolveCategoryName(item.category_id, item.category_name),
      description: item.description,
      price: formatPrice(item.base_price),
      stock: item.stock || 0,
      image: item.image_url,
      variants: item.variants?.map((variant: any) => ({
        name: variant.name,
        price: formatPrice(variant.price),
        stock: variant.stock,
        image: variant.image_url,
      })),
    }));

  const mapLocalProducts = (): Product[] =>
    localProducts.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      price: formatPrice(item.price),
      stock: item.stock,
      image: item.image,
      variants: item.variants?.map((variant) => ({
        name: variant.name,
        price: formatPrice(variant.price),
        stock: variant.stock,
        image: variant.image,
      })),
    }));

  const mapStoredProductsToCatalog = (storedItems: any[]): Product[] =>
    storedItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      price: formatPrice(Number(item.price) || 0),
      stock: Number(item.stock) || 0,
      image: item.image,
      variants: item.variants?.map((variant: any) => ({
        name: variant.name,
        price: formatPrice(Number(variant.price) || 0),
        stock: Number(variant.stock) || 0,
        image: variant.image,
      })),
    }));

  useEffect(() => {
    const loadProducts = async (showLoader = false) => {
      try {
        if (showLoader) {
          setIsLoadingProducts(true);
        }
        
        // Add cache-busting timestamp to force fresh data from backend
        const timestamp = new Date().getTime();
        const res = await fetch(`${apiBaseUrl}/products?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('Format data produk tidak valid');
        }

        const mapped = mapApiProducts(data);
        let nextProducts = mapped;
        // Save with numeric schema expected by getStoredProducts/CartContext.
        if (typeof window !== 'undefined') {
          const productsForStorage = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: Number(item.base_price) || 0,
            stock: Number(item.stock) || 0,
            category: resolveCategoryName(item.category_id, item.category_name),
            description: item.description,
            image: item.image_url,
            variants: item.variants?.map((variant: any) => ({
              name: variant.name,
              price: Number(variant.price) || 0,
              stock: Number(variant.stock) || 0,
              image: variant.image_url,
            })),
          }));

          // Keep extra local products added from admin (not yet in API) so they don't disappear.
          const apiIds = new Set<number>(productsForStorage.map((item: any) => item.id));
          const defaultLocalIds = new Set<number>(localProducts.map((item) => item.id));
          const deletedIds = new Set<number>(
            JSON.parse(localStorage.getItem(DELETED_PRODUCT_IDS_KEY) || '[]') as number[]
          );
          let extraLocalProducts: any[] = [];
          try {
            const rawStored = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || '[]');
            if (Array.isArray(rawStored)) {
              extraLocalProducts = rawStored.filter((item: any) => (
                isValidStoredProduct(item) &&
                !apiIds.has(item.id) &&
                !defaultLocalIds.has(item.id) &&
                !deletedIds.has(item.id)
              ));
            }
          } catch {
            extraLocalProducts = [];
          }

          const mergedStorageProducts = [...productsForStorage, ...extraLocalProducts];
          localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(mergedStorageProducts));

          // Show API products + extra local admin products in the website catalog.
          const extraCatalogProducts = mapStoredProductsToCatalog(extraLocalProducts);
          nextProducts = [...mapped, ...extraCatalogProducts];
        }
        setProducts(nextProducts);
        setProductSource('api');
        setProductLoadNote('');
        // Notify CartContext about product updates (including stock changes)
        window.dispatchEvent(new Event('products-updated'));
      } catch (err) {
        console.error('Gagal fetch produk dari backend:', err);
        const localMapped = mapLocalProducts();
        setProducts(localMapped);
        // Save fallback in schema expected by getStoredProducts/CartContext.
        if (typeof window !== 'undefined') {
          localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(localProducts));
        }
        setProductSource('local');
        setProductLoadNote('Backend belum tersambung. Produk ditampilkan dari data lokal.');
        // Still notify about updates even when loading locally
        window.dispatchEvent(new Event('products-updated'));
      } finally {
        if (showLoader) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts(true);

    // Polling: Auto-refresh products every 3 seconds for faster database sync
    const pollInterval = setInterval(() => {
      loadProducts(false);
    }, 3000);

    try {
      const storedCustomCategories = JSON.parse(
        localStorage.getItem(ADMIN_CUSTOM_CATEGORIES_KEY) || '[]'
      ) as string[];
      setCustomCategories(Array.isArray(storedCustomCategories) ? storedCustomCategories : []);
    } catch {
      setCustomCategories([]);
    }

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Map<string, string>();
    [...products.map((product) => product.category), ...customCategories].forEach((category) => {
      const normalized = category.trim();
      if (!normalized) return;
      const key = normalized.toLowerCase();
      if (!uniqueCategories.has(key)) {
        uniqueCategories.set(key, normalized);
      }
    });

    return Array.from(uniqueCategories.values()).sort((a, b) => a.localeCompare(b, 'id'));
  }, [products, customCategories]);

  useEffect(() => {
    if (activeCategory !== 'all' && !categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, categories]);

  // Keep pagination UX smooth without jumping to catalog on first load.
  useEffect(() => {
    if (!hasMountedPageEffect.current) {
      hasMountedPageEffect.current = true;
      return;
    }

    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  useEffect(() => {
    const section = catalogRef.current;
    if (!section) return;

    const revealTargets = section.querySelectorAll<HTMLElement>('[data-reveal]');
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
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [activeCategory, search, currentPage, isLoadingProducts, products.length]);

  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <section
      ref={catalogRef}
      id="catalog"
      className="py-16 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 85% at 8% 0%, rgba(249, 115, 22, 0.24) 0%, rgba(249, 115, 22, 0) 58%), radial-gradient(85% 65% at 100% 12%, rgba(251, 191, 36, 0.18) 0%, rgba(251, 191, 36, 0) 62%), linear-gradient(180deg, #fff3e2 0%, #ffeedb 46%, #ffe6cf 100%)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.16) 0%, rgba(249, 115, 22, 0) 100%)' }}
      />
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.28) 0%, rgba(251, 191, 36, 0) 70%)' }}
      />
      <div
        className="absolute bottom-0 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-35"
        style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.24) 0%, rgba(249, 115, 22, 0) 72%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "url('https://static.vecteezy.com/system/resources/previews/008/291/069/non_2x/dog-paw-seamless-pattern-bone-dog-footprint-pattern-cartoon-tile-fancy-cream-background-repeat-scarf-isolated-illustration-gift-or-wrapping-paper-puppy-texture-vector.jpg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '420px 420px',
          backgroundPosition: '0 0',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.18,
          background:
            'conic-gradient(from 180deg at 50% 50%, rgba(255, 255, 255, 0) 0deg, rgba(255, 255, 255, 0.14) 80deg, rgba(255, 255, 255, 0) 160deg, rgba(255, 255, 255, 0.08) 240deg, rgba(255, 255, 255, 0) 360deg)',
          mixBlendMode: 'soft-light',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 data-reveal className="reveal-on-scroll text-3xl sm:text-4xl font-bold text-black mb-4">
            Katalog Produk
          </h2>
          <p data-reveal className="reveal-on-scroll text-black max-w-2xl mx-auto mb-8" style={{ ['--reveal-delay' as string]: '80ms' }}>
            Pilihan produk lengkap untuk kebutuhan kucing kesayangan Anda
          </p>
          {productSource === 'local' && productLoadNote && (
            <p data-reveal className="reveal-on-scroll mx-auto mb-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" style={{ ['--reveal-delay' as string]: '120ms' }}>
              {productLoadNote}
            </p>
          )}

          {/* Search Bar */}
          <div data-reveal className="reveal-on-scroll flex justify-center mb-6" style={{ ['--reveal-delay' as string]: '140ms' }}>
            <div
              className="flex w-full max-w-3xl items-center overflow-hidden rounded-xl border bg-white"
              style={{ borderColor: '#d1d5db', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)' }}
            >
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari produk..."
                className="h-12 w-full bg-white px-4 text-base text-gray-700 placeholder:text-gray-400 appearance-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0"
                style={{ outline: 'none', WebkitAppearance: 'none' }}
              />
              <button
                type="button"
                aria-label="Cari produk"
                className="relative z-10 flex h-12 w-14 shrink-0 items-center justify-center border-l transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer"
                style={{
                  borderColor: '#d1d5db',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  borderRadius: '0 8px 8px 0',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div data-reveal className="reveal-on-scroll flex flex-wrap justify-center gap-3" style={{ ['--reveal-delay' as string]: '180ms' }}>
            <button
              onClick={() => {
                setActiveCategory('all');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-sm ${getCategoryBadge('Semua Produk').tone}`}>
                {getCategoryBadge('Semua Produk').isImage ? (
                  <img
                    src={getCategoryBadge('Semua Produk').icon}
                    alt="Semua Produk"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  getCategoryBadge('Semua Produk').icon
                )}
              </span>
              Semua Produk
            </button>
            {categories.map((category) => {
              const badge = getCategoryBadge(category);

              return (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                  <span className={`inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-sm ${badge.tone}`}>
                    {badge.isImage ? (
                      <img src={badge.icon} alt={category} className="h-full w-full object-contain" />
                    ) : (
                      badge.icon
                    )}
                </span>
                {category}
              </button>
              );
            })}
          </div>

          {/* Price Filter (di-nonaktifkan) */}
        </div>

        {/* Products Grid */}
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500"
          key={currentPage}
          style={{ minHeight: 600 }}
        >
          {isLoadingProducts && (
            <div className="col-span-full rounded-2xl border border-orange-100 bg-white/75 p-8 text-center text-gray-700">
              Memuat produk...
            </div>
          )}

          {!isLoadingProducts && paginatedProducts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-orange-100 bg-white/75 p-8 text-center text-gray-700">
              Produk tidak ditemukan. Coba kata kunci lain atau pilih kategori berbeda.
            </div>
          )}

          {paginatedProducts.map((product, index) => {
            const selectedVariantIndex = selectedVariants[product.id] ?? 0;
            const currentVariant = product.variants?.[selectedVariantIndex];
            const displayPrice = currentVariant?.price ?? product.price;
            const displayImage = currentVariant?.image ?? product.image;
            const dbStock = currentVariant?.stock ?? product.stock ?? 0;
            const inCartQuantity = cart
              .filter((item) => (
                item.id === product.id &&
                (item.variant ?? '__default__') === (currentVariant?.name ?? '__default__')
              ))
              .reduce((sum, item) => sum + item.quantity, 0);
            const availableStock = Math.max(0, dbStock - inCartQuantity);

            return (
              <div
                key={product.id}
                data-reveal
                className="reveal-on-scroll bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 hover:scale-105"
                style={{ ['--reveal-delay' as string]: `${Math.min(index * 90, 450)}ms` }}
              >
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden flex items-center justify-center group">
                  <ImageWithFallback
                    src={displayImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {product.description}
                  </p>

                  {/* Variant Selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pilih Varian:
                      </label>
                      <div className="relative">
                        <select
                          value={selectedVariantIndex}
                          onChange={(e) => setSelectedVariants(prev => ({
                            ...prev,
                            [product.id]: parseInt(e.target.value)
                          }))}
                          className="w-full appearance-none rounded-2xl border px-4 py-3 pr-11 text-sm font-medium text-gray-900 shadow-sm outline-none transition-all"
                          style={{
                            borderColor: '#dbe4ee',
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                            boxShadow: '0 10px 20px rgba(15, 23, 42, 0.05)',
                          }}
                        >
                          {product.variants.map((variant, index) => (
                            <option key={index} value={index}>
                              {variant.name} - {variant.price}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        Stok varian: {dbStock}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-orange-600">
                        {displayPrice}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">Stok: {dbStock}</p>
                    </div>
                    
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3" style={{ borderColor: '#e5eef7', backgroundColor: '#f8fbff' }}>
                      <label className="block text-sm font-semibold text-gray-700">Jumlah</label>
                      <div className="flex items-center gap-3 rounded-full border px-3 py-2 bg-white" style={{ borderColor: '#dbe4ee', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedQuantities(prev => ({
                            ...prev,
                            [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                          }))}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                          style={{ background: 'linear-gradient(135deg, #eef2f7 0%, #dbe4ee 100%)' }}
                          aria-label="Kurangi jumlah"
                          disabled={availableStock === 0}
                        >
                          <Minus className="w-4 h-4 text-gray-700" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, dbStock)}
                          value={selectedQuantities[product.id] || 1}
                          onChange={(e) => {
                            const parsedValue = parseInt(e.target.value, 10);
                            if (Number.isNaN(parsedValue)) {
                              setSelectedQuantities(prev => ({ ...prev, [product.id]: 1 }));
                              return;
                            }

                            setSelectedQuantities(prev => ({
                              ...prev,
                              [product.id]: Math.max(1, Math.min(parsedValue, Math.max(1, dbStock)))
                            }));
                          }}
                          className="w-14 text-center text-sm font-bold text-gray-900 bg-transparent outline-none"
                          aria-label="Jumlah produk"
                          disabled={dbStock === 0}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedQuantities(prev => ({
                            ...prev,
                            [product.id]: Math.min((prev[product.id] || 1) + 1, Math.max(1, dbStock))
                          }))}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                          style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                          aria-label="Tambah jumlah"
                          disabled={dbStock === 0 || (selectedQuantities[product.id] || 1) >= dbStock}
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const targetQuantity = Math.min(selectedQuantities[product.id] || 1, Math.max(1, dbStock));
                        const quantityToAdd = Math.max(0, targetQuantity - inCartQuantity);
                        if (quantityToAdd <= 0) {
                          return;
                        }

                        const variant = product.variants ? product.variants[selectedVariantIndex] : undefined;

                        for (let i = 0; i < quantityToAdd; i += 1) {
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: displayPrice,
                            image: displayImage,
                            variant: variant?.name,
                          });
                        }

                        // Notify cart and request auto-open so users can review immediately.
                        window.dispatchEvent(
                          new CustomEvent('cart-notify', {
                            detail: {
                              productName: variant?.name ?? product.name,
                              quantity: quantityToAdd,
                              autoOpen: true,
                            },
                          })
                        );

                        // Reset quantity after adding
                        setSelectedQuantities(prev => ({
                          ...prev,
                          [product.id]: 1
                        }));
                      }}
                      disabled={dbStock === 0 || availableStock === 0}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all font-semibold ${
                        dbStock === 0 || availableStock === 0
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg'
                      }`}
                    >
                      {dbStock === 0 || availableStock === 0 ? '🚫 Stok Habis' : '🛒 Tambah ke Keranjang'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-3 mt-16 mb-8 px-2 py-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-5 py-2 mx-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-5 py-2 mx-1 rounded-lg transition-all duration-200 font-semibold ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-110'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ minWidth: 44 }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-5 py-2 mx-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
