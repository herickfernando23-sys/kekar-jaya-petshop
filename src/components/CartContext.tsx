import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { getStoredProducts } from '../data/products';

export type CartItem = {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
  variant?: string;
  variantId?: number;
};

type ProductStock = {
  id: number;
  stock: number;
  variant?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number, variant?: string) => void;
  updateQuantity: (id: number, quantity: number, variant?: string) => void;
  clearCart: () => void;
  finalizeCheckoutClearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => string;
  getProductStock: (id: number, variant?: string) => number;
  updateProductStock: (id: number, newStock: number, variant?: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'cartItems';

const stockKey = (id: number, variant?: string) => `${id}::${variant ?? '__default__'}`;

const getInitialStocks = (): ProductStock[] => {
  const rawProducts = getStoredProducts();
  const stocks: ProductStock[] = [];

  rawProducts.forEach((product) => {
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant) => {
        stocks.push({ id: product.id, variant: variant.name, stock: variant.stock });
      });
      return;
    }

    stocks.push({ id: product.id, stock: product.stock });
  });

  return stocks;
};

const getInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      return [];
    }

    const parsed = JSON.parse(rawCart);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => (
      item &&
      typeof item.id === 'number' &&
      typeof item.name === 'string' &&
      typeof item.price === 'string' &&
      typeof item.quantity === 'number' &&
      item.quantity > 0 &&
      typeof item.image === 'string' &&
      (item.variant === undefined || typeof item.variant === 'string')
    )) as CartItem[];
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => getInitialCart());
  const [productStocks, setProductStocks] = useState<ProductStock[]>(() => getInitialStocks());
  const stocksRef = useRef<ProductStock[]>(getInitialStocks());

  useEffect(() => {
    const syncStocks = () => {
      const newStocks = getInitialStocks();
      stocksRef.current = newStocks;
      setProductStocks(newStocks);
    };

    // Immediately sync on mount
    syncStocks();

    // Only listen to products-updated event from polling
    // Don't auto-sync on cart changes to avoid race conditions
    window.addEventListener('products-updated', syncStocks);

    return () => {
      window.removeEventListener('products-updated', syncStocks);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const getProductStock = (id: number, variant?: string): number => {
    // Get raw database stock
    let dbStock = 0;
    if (variant) {
      const variantStock = stocksRef.current.find(p => p.id === id && p.variant === variant);
      if (variantStock) {
        dbStock = variantStock.stock;
      }
    } else {
      const product = stocksRef.current.find(p => p.id === id && !p.variant);
      dbStock = product ? product.stock : 0;
    }

    // Calculate items already in cart for this product/variant
    const cartQuantity = cart
      .filter(item => item.id === id && (item.variant ?? '__default__') === (variant ?? '__default__'))
      .reduce((sum, item) => sum + item.quantity, 0);

    // Available stock = database stock - cart items
    return Math.max(0, dbStock - cartQuantity);
  };

  const updateProductStock = (id: number, newStock: number, variant?: string) => {
    const finalStock = Math.max(0, newStock);

    // Update ref synchronously for immediate effect
    let foundStock = false;
    stocksRef.current = stocksRef.current.map((stock) => {
      if (stock.id === id && (stock.variant ?? '__default__') === (variant ?? '__default__')) {
        foundStock = true;
        return { ...stock, stock: finalStock };
      }
      return stock;
    });

    if (!foundStock) {
      stocksRef.current = [...stocksRef.current, { id, variant, stock: finalStock }];
    }

    // Update state for render
    setProductStocks(stocksRef.current);

    // Persist stock changes to localStorage
    if (typeof window !== 'undefined') {
      const storedProducts = getStoredProducts();
      const updatedProducts = storedProducts.map((product) => {
        if (product.id !== id) {
          return product;
        }

        if (variant && product.variants && product.variants.length > 0) {
          const updatedVariants = product.variants.map((item) =>
            item.name === variant ? { ...item, stock: finalStock } : item
          );

          const totalStock = updatedVariants.reduce((sum, item) => sum + item.stock, 0);
          return {
            ...product,
            stock: totalStock,
            variants: updatedVariants,
          };
        }

        return { ...product, stock: finalStock };
      });

      // Keep memory stock cache in sync with updated product stock totals.
      const cacheByKey = new Map<string, ProductStock>();
      stocksRef.current.forEach((item) => {
        cacheByKey.set(stockKey(item.id, item.variant), item);
      });
      updatedProducts.forEach((product) => {
        if (!product.variants || product.variants.length === 0) {
          cacheByKey.set(stockKey(product.id), { id: product.id, stock: product.stock });
          return;
        }

        product.variants.forEach((variantItem) => {
          cacheByKey.set(stockKey(product.id, variantItem.name), {
            id: product.id,
            variant: variantItem.name,
            stock: variantItem.stock,
          });
        });
      });
      stocksRef.current = Array.from(cacheByKey.values());
      setProductStocks(stocksRef.current);

      localStorage.setItem('products', JSON.stringify(updatedProducts));
      window.dispatchEvent(new Event('products-updated'));
    }
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    const currentStock = getProductStock(item.id, item.variant);
    // Check if stock is available
    if (currentStock <= 0) {
      alert('Maaf, produk ini sedang habis stok!');
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(
        cartItem => cartItem.id === item.id && cartItem.variant === item.variant && cartItem.variantId === item.variantId
      );
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id && cartItem.variant === item.variant && cartItem.variantId === item.variantId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: number, variant?: string) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === id && item.variant === variant)));
  };

  const updateQuantity = (id: number, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, variant);
      return;
    }

    // Check if we have enough stock
    const currentStock = getProductStock(id, variant);
    const currentItem = cart.find(item => item.id === id && item.variant === variant);
    
    if (!currentItem) return;

    const quantityDifference = quantity - currentItem.quantity;
    
    // If increasing quantity, check if enough stock available
    if (quantityDifference > 0 && currentStock < quantityDifference) {
      alert('Maaf, stok tidak mencukupi!');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id && item.variant === variant
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const finalizeCheckoutClearCart = () => {
    // Checkout sudah dikonfirmasi, stok tetap terpotong dan keranjang hanya dikosongkan.
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    const total = cart.reduce((sum, item) => {
      const price = parseInt(item.price.replace(/[^\d]/g, ''));
      return sum + (price * item.quantity);
    }, 0);
    return `Rp ${total.toLocaleString('id-ID')}`;
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      finalizeCheckoutClearCart,
      getTotalItems,
      getTotalPrice,
      getProductStock,
      updateProductStock,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}