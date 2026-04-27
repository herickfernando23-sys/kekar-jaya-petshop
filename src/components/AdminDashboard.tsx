import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { getStoredProducts, PRODUCT_STORAGE_KEY, DELETED_PRODUCT_IDS_KEY } from '../data/products';
import type { Product, ProductVariant } from '../data/products';

type EditingData = {
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  variants?: ProductVariant[];
};

type NewProductData = {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: string;
};

const ADMIN_CUSTOM_CATEGORIES_KEY = 'adminCustomCategories';
const UNDO_DELETE_WINDOW_MS = 5000;
const DEFAULT_CATEGORY_KEYS = new Set([
  'makanan kucing',
  'pasir kucing',
  'kandang kucing',
]);

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingData, setEditingData] = useState<EditingData | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_CUSTOM_CATEGORIES_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newProduct, setNewProduct] = useState<NewProductData>({
    name: '',
    category: 'Makanan Kucing',
    price: 0,
    stock: 0,
    description: '',
    image: '/images/whiskas.jpg',
  });
  const [undoDeletedProduct, setUndoDeletedProduct] = useState<{ product: Product; index: number } | null>(null);
  const [editPanelOffsetTop, setEditPanelOffsetTop] = useState(0);
  const undoTimerRef = useRef<number | null>(null);
  const productsSectionRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const apiBaseUrl = (((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:5000')
    .replace(/\/+$/, '');

  const syncProductsFromServer = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/products?t=${Date.now()}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return;
      }

      const mappedProducts: Product[] = data.map((item: any) => ({
        id: Number(item.id),
        name: item.name,
        category: item.category_name || 'Makanan Kucing',
        price: Number(item.base_price) || 0,
        stock: Number(item.stock) || 0,
        description: item.description || '',
        image: item.image_url || '/images/whiskas.jpg',
        variants: Array.isArray(item.variants)
          ? item.variants.map((variant: any) => ({
              name: variant.name,
              price: Number(variant.price) || 0,
              stock: Number(variant.stock) || 0,
              image: variant.image_url || variant.image,
            }))
          : [],
      }));

      setProducts(mappedProducts);
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(mappedProducts));
      localStorage.setItem(DELETED_PRODUCT_IDS_KEY, '[]');
    } catch {
      // Keep local data when backend is unavailable.
    }
  };

  // Listen for product updates from CartContext or other sources
  useEffect(() => {
    // Hapus cache produk dan ID terhapus setiap kali halaman admin dibuka
    localStorage.removeItem(PRODUCT_STORAGE_KEY);
    localStorage.removeItem(DELETED_PRODUCT_IDS_KEY);
    setProducts([]);

    const handleProductsUpdated = () => {
      setProducts(getStoredProducts());
    };

    syncProductsFromServer();

    window.addEventListener('products-updated', handleProductsUpdated);
    window.addEventListener('storage', handleProductsUpdated);

    return () => {
      window.removeEventListener('products-updated', handleProductsUpdated);
      window.removeEventListener('storage', handleProductsUpdated);
    };
  }, []);

  // Get unique categories
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

  // Filter products by category
  const filteredProducts = (selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products
  ).slice().sort((a, b) => a.id - b.id);

  const restoreDeletedProductLocally = (product: Product, index: number) => {
    setProducts((currentProducts) => {
      const alreadyExists = currentProducts.some((item) => item.id === product.id);
      const restored = alreadyExists
        ? currentProducts
        : (() => {
            const next = [...currentProducts];
            next.splice(index, 0, product);
            return next;
          })();

      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(restored));
      return restored;
    });

    const deletedIds = new Set<number>(
      JSON.parse(localStorage.getItem(DELETED_PRODUCT_IDS_KEY) || '[]') as number[]
    );
    deletedIds.delete(product.id);
    localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(Array.from(deletedIds)));
    window.dispatchEvent(new Event('products-updated'));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('loginTimestamp');
    navigate('/admin');
  };

  const handleEditProduct = (product: Product) => {
    setIsAddProductOpen(false);

    if (editingProduct?.id === product.id) {
      setEditingProduct(null);
      setEditingData(null);
      setEditPanelOffsetTop(0);
      return;
    }

    const initialVariants = product.variants?.map((variant) => ({ ...variant })) || [];
    const initialStockFromVariants = initialVariants && initialVariants.length > 0
      ? initialVariants.reduce((sum, variant) => sum + variant.stock, 0)
      : product.stock;

    setEditingProduct(product);
    setEditingData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: initialStockFromVariants,
      image: product.image,
      variants: initialVariants
    });

    const rowElement = document.getElementById(`admin-product-row-${product.id}`);
    if (rowElement && productsSectionRef.current) {
      const rowRect = rowElement.getBoundingClientRect();
      const sectionRect = productsSectionRef.current.getBoundingClientRect();
      setEditPanelOffsetTop(Math.max(0, rowRect.top - sectionRect.top));
      return;
    }

    setEditPanelOffsetTop(0);
  };

  const handleAddCategory = () => {
    const categoryName = newCategoryInput.trim();
    if (!categoryName) return;

    const alreadyExists = categories.some((category) => category.toLowerCase() === categoryName.toLowerCase());
    if (alreadyExists) {
      setNewCategoryInput('');
      setSelectedCategory(categoryName);
      return;
    }

    const updatedCustomCategories = [...customCategories, categoryName].sort((a, b) => a.localeCompare(b, 'id'));
    setCustomCategories(updatedCustomCategories);
    localStorage.setItem(ADMIN_CUSTOM_CATEGORIES_KEY, JSON.stringify(updatedCustomCategories));
    window.dispatchEvent(new Event('categories-updated'));
    setSelectedCategory(categoryName);
    setNewProduct((prev) => ({ ...prev, category: categoryName }));
    setNewCategoryInput('');
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const normalizedCategory = categoryName.trim().toLowerCase();
    if (!normalizedCategory) return;

    if (DEFAULT_CATEGORY_KEYS.has(normalizedCategory)) {
      window.alert('Kategori bawaan tidak dapat dihapus.');
      return;
    }

    const affectedProductsCount = products.filter(
      (product) => product.category.trim().toLowerCase() === normalizedCategory
    ).length;

    const confirmMessage = affectedProductsCount > 0
      ? `Hapus kategori "${categoryName}"? ${affectedProductsCount} produk dalam kategori ini juga akan dihapus.`
      : `Hapus kategori "${categoryName}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`${apiBaseUrl}/categories/${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let message = 'Gagal menghapus kategori di server.';
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            message = errorBody.error;
          }
        } catch {
          // Use default message when server response is not JSON.
        }
        throw new Error(message);
      }
    } catch (error: any) {
      window.alert(error?.message || 'Gagal menghapus kategori di server.');
      return;
    }

    if (affectedProductsCount > 0) {
      const updatedProducts = products.filter(
        (product) => product.category.trim().toLowerCase() !== normalizedCategory
      );

      setProducts(updatedProducts);
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(updatedProducts));
      window.dispatchEvent(new Event('products-updated'));

      setEditingData((current) => {
        if (!current || current.category.trim().toLowerCase() !== normalizedCategory) {
          return current;
        }

        return null;
      });

      setEditingProduct((current) => (
        current && current.category.trim().toLowerCase() === normalizedCategory
          ? null
          : current
      ));
    }

    const updatedCustomCategories = customCategories.filter(
      (category) => category.trim().toLowerCase() !== normalizedCategory
    );
    setCustomCategories(updatedCustomCategories);
    localStorage.setItem(ADMIN_CUSTOM_CATEGORIES_KEY, JSON.stringify(updatedCustomCategories));
    window.dispatchEvent(new Event('categories-updated'));

    if (selectedCategory?.trim().toLowerCase() === normalizedCategory) {
      setSelectedCategory(null);
    }

    setNewProduct((current) => (
      current.category.trim().toLowerCase() === normalizedCategory
        ? { ...current, category: 'Makanan Kucing' }
        : current
    ));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      window.alert('Nama produk wajib diisi.');
      return;
    }

    const payload = {
      name: newProduct.name.trim(),
      category: newProduct.category.trim() || 'Makanan Kucing',
      price: Math.max(0, newProduct.price),
      stock: Math.max(0, newProduct.stock),
      description: newProduct.description.trim() || 'Produk baru dari admin',
      image: newProduct.image.trim() || '/images/whiskas.jpg',
    };

    try {
      const response = await fetch(`${apiBaseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = 'Gagal menambahkan produk ke server.';
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            message = errorBody.error;
          }
        } catch {
          // Use default message when server doesn't return JSON.
        }
        throw new Error(message);
      }

      const created = await response.json();
      const addedProduct: Product = {
        id: created.id,
        name: created.name,
        category: created.category_name || payload.category,
        price: Number(created.base_price) || payload.price,
        stock: Number(created.stock) || payload.stock,
        description: created.description || payload.description,
        image: created.image_url || payload.image,
        variants: [],
      };

      const updatedProducts = [addedProduct, ...products.filter((product) => product.id !== addedProduct.id)];

      setProducts(updatedProducts);
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(updatedProducts));

      const deletedIds = new Set<number>(
        JSON.parse(localStorage.getItem(DELETED_PRODUCT_IDS_KEY) || '[]') as number[]
      );
      deletedIds.delete(addedProduct.id);
      localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(Array.from(deletedIds)));

      window.dispatchEvent(new Event('products-updated'));
      setSelectedCategory(addedProduct.category);
      setNewProduct({
        name: '',
        category: 'Makanan Kucing',
        price: 0,
        stock: 0,
        description: '',
        image: '/images/whiskas.jpg',
      });
      setIsAddProductOpen(false);
    } catch (error: any) {
      window.alert(error?.message || 'Gagal menambahkan produk.');
    }
  };

  const deleteProductOnServer = async (targetProductId: number) => {
    const response = await fetch(`${apiBaseUrl}/products/${targetProductId}`, {
      method: 'DELETE',
    });

    // If product is already gone on server, treat it as success.
    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      let message = 'Gagal menghapus produk di server.';
      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      } catch {
        // Use default message if response is not JSON.
      }
      throw new Error(message);
    }
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${apiBaseUrl}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let message = 'Gagal upload gambar ke server.';
      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      } catch {
        // Use default message if response is not JSON.
      }
      throw new Error(message);
    }

    const result = await response.json();
    if (!result?.imageUrl || typeof result.imageUrl !== 'string') {
      throw new Error('Respons upload gambar tidak valid.');
    }

    return result.imageUrl;
  };

  const handleDeleteProduct = async (productId: number) => {
    const confirmed = window.confirm('Yakin ingin menghapus produk ini?');
    if (!confirmed) return;

    if (undoDeletedProduct) {
      const pendingDelete = undoDeletedProduct;

      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }

      try {
        await deleteProductOnServer(pendingDelete.product.id);
        setUndoDeletedProduct(null);
      } catch (error: any) {
        restoreDeletedProductLocally(pendingDelete.product, pendingDelete.index);
        setUndoDeletedProduct(null);
        window.alert(error?.message || 'Gagal menghapus produk di server. Produk dikembalikan ke daftar.');
        return;
      }
    }

    const index = products.findIndex((product) => product.id === productId);
    if (index === -1) return;

    const deletedProduct = products[index];
    const updatedProducts = products.filter((product) => product.id !== productId);
    const deletedIds = new Set<number>(
      JSON.parse(localStorage.getItem(DELETED_PRODUCT_IDS_KEY) || '[]') as number[]
    );
    deletedIds.add(productId);

    // Optimistic remove in UI first, then commit hard delete after 5s unless user undoes.
    setProducts(updatedProducts);
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(updatedProducts));
    localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(Array.from(deletedIds)));
    window.dispatchEvent(new Event('products-updated'));
    setEditingProduct((current) => (current?.id === productId ? null : current));
    setEditingData((current) => (editingProduct?.id === productId ? null : current));
    setUndoDeletedProduct({ product: deletedProduct, index });

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
    }

    undoTimerRef.current = window.setTimeout(async () => {
      try {
        await deleteProductOnServer(productId);
        setUndoDeletedProduct(null);
        undoTimerRef.current = null;
        // Setelah hapus sukses, fetch ulang data produk dari server
        await syncProductsFromServer();
      } catch (error: any) {
        restoreDeletedProductLocally(deletedProduct, index);
        setUndoDeletedProduct(null);
        undoTimerRef.current = null;
        window.alert(error?.message || 'Gagal menghapus produk di server. Produk dikembalikan ke daftar.');
      }
    }, UNDO_DELETE_WINDOW_MS);
  };

  const handleUndoDelete = () => {
    if (!undoDeletedProduct) return;

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    restoreDeletedProductLocally(undoDeletedProduct.product, undoDeletedProduct.index);
    setUndoDeletedProduct(null);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !editingData) return;

    const normalizedVariants = editingData.variants?.map((variant) => ({
      ...variant,
      stock: Math.max(0, variant.stock),
      price: Math.max(0, variant.price),
    }));

    const finalStock = Math.max(0, editingData.stock);

    const payload = {
      name: editingData.name,
      category: editingData.category,
      price: Math.max(0, editingData.price),
      stock: finalStock,
      description: editingProduct.description,
      image: editingData.image || editingProduct.image,
      variants: normalizedVariants,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = 'Gagal menyimpan perubahan produk.';
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            message = errorBody.error;
          }
        } catch {
          // Use default message if response is not JSON.
        }
        throw new Error(message);
      }

      const updated = await response.json();
      const updatedProduct: Product = {
        id: updated.id,
        name: updated.name,
        category: updated.category_name || payload.category,
        price: Number(updated.base_price) || payload.price,
        stock: Number(updated.stock) || payload.stock,
        description: updated.description || payload.description,
        image: updated.image_url || payload.image,
        variants: Array.isArray(updated.variants)
          ? updated.variants.map((variant: any) => ({
              name: variant.name,
              price: Number(variant.price) || 0,
              stock: Number(variant.stock) || 0,
              image: variant.image_url || variant.image,
            }))
          : normalizedVariants,
      };

      const updatedProducts = products.map((product) =>
        product.id === editingProduct.id ? updatedProduct : product
      );

      setProducts(updatedProducts);
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(updatedProducts));
      window.dispatchEvent(new Event('products-updated'));
      setEditingProduct(null);
      setEditingData(null);
      setEditPanelOffsetTop(0);
    } catch (error: any) {
      window.alert(error?.message || 'Gagal menyimpan perubahan produk.');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Habis', color: 'bg-red-100 text-red-800' };
    if (stock <= 5) return { text: 'Terbatas', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Tersedia', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(circle at 12% -18%, #fff1e6 0%, #fff7ef 42%, #f8fafc 100%)',
      }}
    >
      {/* Header */}
      <div className="bg-white/90 backdrop-blur shadow-sm border-b border-orange-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 font-medium">Kelola stok dan harga produk Kekar Jaya</p>
            </div>
            <button
              onClick={handleLogout}
              type="button"
              className="px-8 py-3 rounded-xl text-base font-extrabold shadow-md hover:shadow-lg transition-all border-2 border-red-800 tracking-wide hover:-translate-y-0.5"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 p-6 rounded-2xl shadow-sm border border-blue-100">
            <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Total Produk</h3>
            <p className="text-4xl font-extrabold text-blue-600 mt-1">{products.length}</p>
          </div>
          <div className="bg-white/95 p-6 rounded-2xl shadow-sm border border-amber-100">
            <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Stok Rendah</h3>
            <p className="text-4xl font-extrabold text-amber-600 mt-1">
              {products.filter(p => p.stock <= 5 && p.stock > 0).length}
            </p>
          </div>
          <div className="bg-white/95 p-6 rounded-2xl shadow-sm border border-red-100">
            <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Stok Habis</h3>
            <p className="text-4xl font-extrabold text-red-600 mt-1">
              {products.filter(p => p.stock === 0).length}
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white/95 shadow-sm rounded-2xl p-6 mb-6 border border-orange-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Filter Kategori</h3>
          <div className="flex flex-wrap gap-8 border-b border-gray-200">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`pb-3 font-semibold text-base transition duration-200 relative ${
                selectedCategory === null
                  ? 'text-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Produk
              {selectedCategory === null && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t"></div>
              )}
            </button>
            {categories.map((category) => {
              const canDeleteCategory = !DEFAULT_CATEGORY_KEYS.has(category.trim().toLowerCase());

              return (
                <div key={category} className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`pb-3 font-semibold text-base transition duration-200 relative ${
                      selectedCategory === category
                        ? 'text-orange-500'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {category}
                    {selectedCategory === category && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t"></div>
                    )}
                  </button>
                  {canDeleteCategory && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      className="pb-3 text-red-500 hover:text-red-700"
                      title={`Hapus kategori ${category}`}
                      aria-label={`Hapus kategori ${category}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex gap-2">
            <input
              type="text"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              placeholder="Tambah kategori baru"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 rounded-xl font-bold border whitespace-nowrap shadow-sm hover:shadow transition-all"
              style={{ backgroundColor: '#063ef6', color: '#ffffff', borderColor: '#0c5dea', minWidth: '92px' }}
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Products Table and Edit Panel Container */}
        <div ref={productsSectionRef} className="flex gap-6 items-start">
          {/* Products Table */}
          <div className="flex-1 bg-white/95 shadow-sm border border-gray-200 overflow-hidden sm:rounded-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap bg-gradient-to-r from-white to-orange-50">
              <h3 className="text-lg font-bold text-gray-900">
                Daftar Produk ({filteredProducts.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen((prev) => !prev)}
                className="px-4 py-2 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all border-2 border-green-700 tracking-wide appearance-none hover:-translate-y-0.5"
                style={{ backgroundColor: '#16a34a', color: '#ffffff', borderColor: '#15803d' }}
              >
                {isAddProductOpen ? 'Tutup Produk' : 'Tambah Produk'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product, index) => {
                    const status = getStockStatus(product.stock);
                    const isCurrentlyEditing = editingProduct?.id === product.id;

                    return (
                      <tr
                        id={`admin-product-row-${product.id}`}
                        key={product.id}
                        className={`${isCurrentlyEditing ? 'bg-blue-50' : ''} hover:bg-orange-50/50 transition-colors`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Rp {product.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.stock}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-left"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-left"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {(isAddProductOpen || (editingProduct && editingData)) && (
            <div className="w-96 space-y-4">
              {isAddProductOpen && (
                <div className="bg-white shadow-sm rounded-2xl p-6 border border-orange-100 h-fit max-h-[calc(100vh-150px)] overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tambah Produk</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Produk</label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Nama produk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Harga</label>
                      <input
                        type="number"
                        min="0"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Stok</label>
                      <input
                        type="number"
                        min="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Deskripsi produk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Path Gambar</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const selectedFile = e.target.files?.[0];
                          if (!selectedFile) return;

                          try {
                            const imageUrl = await uploadImageFile(selectedFile);
                            setNewProduct((prev) => ({ ...prev, image: imageUrl }));
                          } catch (error: any) {
                            window.alert(error?.message || 'Gagal upload gambar.');
                          }
                        }}
                        className="w-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        style={{
                          background: 'none',
                        }}
                        /* Custom file button style for all browsers */
                        /* Hide default, show custom */
                        /* Use a visually hidden input and a styled label if needed for full control */
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="px-5 py-3 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 shadow-md transition-all border border-orange-800 appearance-none hover:-translate-y-0.5"
                      style={{ color: '#ffffff', backgroundColor: '#16a34a', borderColor: '#15803d' }}
                    >
                      Tambah Produk
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Panel - Sticky on right */}
              {editingProduct && editingData && (
                <div
                  className="bg-white shadow-2xl rounded-lg h-fit max-h-[calc(100vh-150px)] overflow-hidden flex flex-col border-2 border-orange-500"
                  style={{ marginTop: `${editPanelOffsetTop}px` }}
                >
              <div className="px-6 py-4 border-b-2 border-gray-300 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-orange-50 to-white">
                <h3 className="text-lg font-bold text-gray-900">Edit Produk</h3>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setEditingData(null);
                    setEditPanelOffsetTop(0);
                  }}
                  className="text-gray-500 hover:text-red-600 font-bold text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                {/* Product Info */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    value={editingData.name}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        name: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-orange-400 rounded font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={editingData.category}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        category: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-orange-400 rounded font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Gambar Produk
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const selectedFile = e.target.files?.[0];
                      if (!selectedFile) return;

                      try {
                        const imageUrl = await uploadImageFile(selectedFile);
                        setEditingData({
                          ...editingData,
                          image: imageUrl,
                        });
                      } catch (error: any) {
                        window.alert(error?.message || 'Gagal upload gambar.');
                      }
                    }}
                    className="w-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Edit Table */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Edit Harga & Stok
                  </label>
                  <table className="w-full text-sm border-2 border-gray-300 rounded">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-800 border-b">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left font-bold text-gray-800 border-b">
                          Nilai
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-3 py-2 font-bold text-gray-700 bg-orange-50">Harga</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={editingData.price}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                price: parseInt(e.target.value) || 0
                              })
                            }
                            className="w-full px-3 py-2 border-2 border-orange-400 rounded font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-gray-700 bg-orange-50">Stok</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={editingData.stock}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                stock: parseInt(e.target.value) || 0
                              })
                            }
                            className="w-full px-3 py-2 border-2 border-orange-400 rounded font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Varian Produk
                  </label>

                  <div className="mb-3 flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVariants = [
                          ...(editingData.variants || []),
                          {
                            name: `Varian ${(editingData.variants?.length || 0) + 1}`,
                            price: Math.max(0, editingData.price),
                            stock: 0,
                            image: editingData.image,
                          },
                        ];

                        setEditingData({
                          ...editingData,
                          variants: nextVariants,
                        });
                      }}
                      className="w-full rounded-xl border-2 px-4 py-3 text-base font-extrabold shadow-md transition-all min-h-14"
                      style={{
                        backgroundColor: '#2563eb',
                        borderColor: '#1e40af',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                    >
                      <span style={{ fontSize: '20px', lineHeight: '1' }}>+</span>
                      <span>Tambah Varian</span>
                    </button>
                  </div>

                  {editingData.variants && editingData.variants.length > 0 && (
                    <div className="space-y-2">
                      {editingData.variants.map((variant, index) => (
                        <div key={`variant-${editingProduct?.id}-${index}`} className="bg-gray-50 border border-gray-200 rounded p-2 space-y-2">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => {
                                  const nextName = e.target.value;
                                  setEditingData({
                                    ...editingData,
                                    variants: editingData.variants?.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, name: nextName } : item
                                    ),
                                  });
                                }}
                                className="w-full px-2 py-1 border border-orange-300 rounded text-xs font-semibold"
                                aria-label={`Nama varian ${index + 1}`}
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="number"
                                min="0"
                                value={variant.price}
                                onChange={(e) => {
                                  const price = parseInt(e.target.value, 10) || 0;
                                  setEditingData({
                                    ...editingData,
                                    variants: editingData.variants?.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, price } : item
                                    ),
                                  });
                                }}
                                className="w-full px-2 py-1 border border-orange-300 rounded text-xs font-semibold"
                                aria-label={`Harga varian ${variant.name}`}
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) => {
                                  const stock = parseInt(e.target.value, 10) || 0;
                                  const updatedVariants = editingData.variants?.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, stock } : item
                                  );

                                  setEditingData({
                                    ...editingData,
                                    variants: updatedVariants,
                                  });
                                }}
                                className="w-full px-2 py-1 border border-orange-300 rounded text-xs font-semibold"
                                aria-label={`Stok varian ${variant.name}`}
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedVariants = (editingData.variants || []).filter(
                                    (_, itemIndex) => itemIndex !== index
                                  );

                                  setEditingData({
                                    ...editingData,
                                    variants: updatedVariants,
                                  });
                                }}
                                className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold"
                                aria-label={`Hapus varian ${variant.name}`}
                              >
                                X
                              </button>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const selectedFile = e.target.files?.[0];
                              if (!selectedFile) return;

                              try {
                                const imageUrl = await uploadImageFile(selectedFile);
                                setEditingData({
                                  ...editingData,
                                  variants: editingData.variants?.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, image: imageUrl } : item
                                  ),
                                });
                              } catch (error: any) {
                                window.alert(error?.message || 'Gagal upload gambar varian.');
                              }
                            }}
                            aria-label={`Pilih gambar varian ${variant.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons - Always visible at bottom - VERY PROMINENT */}
              <div className="px-6 py-4 border-t-2 border-gray-300 bg-gradient-to-r from-orange-50 to-white flex gap-3 flex-shrink-0 shadow-xl">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setEditingData(null);
                    setEditPanelOffsetTop(0);
                  }}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400 transition-all border border-gray-500"
                >
                  ✕ BATAL
                </button>
                <button
                  onClick={handleSaveProduct}
                  type="button"
                  className="flex-1 px-4 py-3 text-base font-bold rounded-lg transition-all shadow-lg hover:shadow-xl border-2 border-green-700"
                  style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                >
                  ✓ SIMPAN
                </button>
              </div>
            </div>
              )}
            </div>
          )}
        </div>
      </div>

      {undoDeletedProduct && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
          <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="text-sm">
              Produk <span className="font-bold">{undoDeletedProduct.product.name}</span> dihapus.
              <span className="ml-2 text-gray-300">(Undo dalam 5 detik)</span>
            </div>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-bold text-white"
            >
              Undo
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
