export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  name: string;
  price: number;
  stock: number;
  image?: string;
}

export const PRODUCT_STORAGE_KEY = 'products';
export const DELETED_PRODUCT_IDS_KEY = 'deletedProductIds';

export const products: Product[] = [
  {
    id: 6,
    name: 'WHISKAS Junior',
    price: 70000,
    stock: 30,
    category: 'Makanan Kucing',
    description: 'Makanan khusus untuk anak kucing dengan nutrisi lengkap',
    image: '/images/whiskas.jpg',
    variants: [
      { name: 'Whiskas Junior Rasa Ikan Laut', price: 70000, stock: 12, image: '/images/whiskas.jpg' },
      { name: 'Whiskas Junior Mackerel Flavor', price: 70000, stock: 8, image: '/images/whiskasmackarel.jpg' },
      { name: 'Whiskas Junior Tuna & Salmon Flavour', price: 70000, stock: 10, image: '/images/whiskastuna.jpg' }
    ]
  },
  {
    id: 7,
    name: 'Furlove',
    price: 15000,
    stock: 40,
    category: 'Makanan Kucing',
    description: 'Makanan premium untuk kucing dewasa',
    image: '/images/furlove.jpg',
    variants: [
      { name: 'Furlove (kaleng)', price: 15000, stock: 20, image: '/images/furlove.jpg' },
      { name: 'Furlove Tuna dry cat food', price: 28500, stock: 20, image: '/images/furlovedry.jpg' }
    ]
  },
  {
    id: 8,
    name: 'Cat Choize',
    price: 15500,
    stock: 35,
    category: 'Makanan Kucing',
    description: 'Makanan kucing dengan protein berkualitas tinggi',
    image: '/images/catchoize.jpg',
    variants: [
      { name: 'Tuna Flavor', price: 15500, stock: 9, image: '/images/catchoize.jpg' },
      { name: 'Tuna with Milk (dry)', price: 30000, stock: 8, image: '/images/catchoize2.jpg' },
      { name: 'Cat Choize Adult Cat Dry Food Tuna', price: 21000, stock: 9, image: '/images/catchoizetuna.jpg' },
      { name: 'Cat Choize Kitten Salmon with Milk (dry)', price: 33000, stock: 9, image: '/images/catchoizesalmon.jpg' }
    ]
  },
  {
    id: 9,
    name: 'Excel Chicken Tuna',
    price: 15000,
    stock: 28,
    category: 'Makanan Kucing',
    description: 'Makanan kucing ayam dan tuna dengan vitamin mineral',
    image: '/images/excel.jpg'
  },
  {
    id: 10,
    name: 'Bolt Cat',
    price: 24500,
    stock: 20,
    category: 'Makanan Kucing',
    description: 'Makanan kucing tuna dengan taurin untuk mata sehat',
    image: '/images/bolt.jpg',
    variants: [
      { name: 'Bolt Cat Tuna', price: 24500, stock: 7, image: '/images/bolt.jpg' },
      { name: 'Bolt Cat Salmon', price: 24500, stock: 7, image: '/images/bolttuna.jpg' },
      { name: 'Bolt Cat Salmon Kitten', price: 16000, stock: 6, image: '/images/boltkitten.jpg' }
    ]
  },
  {
    id: 11,
    name: 'Felibite',
    price: 15000,
    stock: 32,
    category: 'Makanan Kucing',
    description: 'Makanan kucing dengan omega 3 & 6',
    image: '/images/felibite.jpg'
  },
  {
    id: 12,
    name: 'Me-O Persian Adult',
    price: 60000,
    stock: 18,
    category: 'Makanan Kucing',
    description: 'Makanan kering untuk kucing persia dewasa',
    image: '/images/Me-o.jpg'
  },
  {
    id: 13,
    name: 'Lifecat',
    price: 18000,
    stock: 25,
    category: 'Makanan Kucing',
    description: 'Makanan kucing dengan daging asli',
    image: '/images/lifecat.jpg'
  },
  {
    id: 14,
    name: 'Markotops',
    price: 18000,
    stock: 22,
    category: 'Makanan Kucing',
    description: 'Makanan kucing daging lembut dengan kuah',
    image: '/images/markotops.jpg'
  },
  {
    id: 15,
    name: 'Chester Tuna',
    price: 23000,
    stock: 19,
    category: 'Makanan Kucing',
    description: 'Makanan kucing rasa tuna lezat',
    image: '/images/chester.jpg'
  },
  {
    id: 16,
    name: 'Beauty Premium Cat Food',
    price: 35000,
    stock: 15,
    category: 'Makanan Kucing',
    description: 'Makanan kucing premium untuk kecantikan bulu',
    image: '/images/beauty.jpg'
  },
  {
    id: 17,
    name: 'Me-O Wet Cat Food',
    price: 8000,
    stock: 50,
    category: 'Makanan Kucing',
    description: 'Makanan kucing basah rasa ikan',
    image: '/images/me-obasah.jpg'
  },
  {
    id: 18,
    name: 'Life Cat Tuna Kitten',
    price: 7000,
    stock: 45,
    category: 'Makanan Kucing',
    description: 'Makanan basah untuk anak kucing',
    image: '/images/lifecatwet.jpg'
  },
  {
    id: 19,
    name: 'Crystal Kitty',
    price: 16000,
    stock: 30,
    category: 'Makanan Kucing',
    description: 'Makanan kucing dengan kandungan air seimbang',
    image: '/images/crystal.jpg'
  },
  {
    id: 20,
    name: 'Lezato Tuna',
    price: 25000,
    stock: 21,
    category: 'Makanan Kucing',
    description: 'Makanan kucing tuna berkualitas',
    image: '/images/lezato.jpg'
  },
  {
    id: 21,
    name: 'Pet Choice',
    price: 11000,
    stock: 38,
    category: 'Makanan Kucing',
    description: 'Makanan kucing dengan asam lemak esensial',
    image: '/images/petchoice.jpg'
  },
  {
    id: 22,
    name: 'Pasir Kucing CatLike',
    price: 100000,
    stock: 5,
    category: 'Pasir Kucing',
    description: 'Pasir kucing bentonite premium organik 25L',
    image: '/images/catlike.jpg'
  },
  {
    id: 23,
    name: 'Pasir Kucing Napping Cat',
    price: 30000,
    stock: 16,
    category: 'Pasir Kucing',
    description: 'Pasir gumpal premium dengan aroma wangi',
    image: '/images/napping cat.jpg'
  },
  {
    id: 24,
    name: 'Grand Panda Pasir',
    price: 37700,
    stock: 14,
    category: 'Pasir Kucing',
    description: 'Pasir gumpal premium 5L dengan daya serap tinggi',
    image: '/images/grandpanda.jpg'
  },
  {
    id: 25,
    name: 'Markotops Pasir Kucing',
    price: 145000,
    stock: 3,
    category: 'Pasir Kucing',
    description: 'Pasir bentonite 25L dengan daya gumpal kuat',
    image: '/images/markotopspasir.jpg'
  },
  {
    id: 26,
    name: 'Bentonite Cat Litter',
    price: 40000,
    stock: 11,
    category: 'Pasir Kucing',
    description: 'Pasir kucing minim debu dan tidak lengket',
    image: '/images/bentonitecat.jpg'
  },
  {
    id: 27,
    name: 'Meowpets Cat Litter',
    price: 135000,
    stock: 2,
    category: 'Pasir Kucing',
    description: 'Pasir kucing dengan butiran aromatik',
    image: '/images/meowpets.jpg'
  },
  {
    id: 28,
    name: 'Taro Aqua Fresh',
    price: 105000,
    stock: 4,
    category: 'Pasir Kucing',
    description: 'Pasir bentonite 25L dengan daya serap instan',
    image: '/images/taro.jpg'
  },
  {
    id: 29,
    name: 'Bak Pasir Kucing Plastik',
    price: 30000,
    stock: 20,
    category: 'Kandang Kucing',
    description: 'Wadah pasir plastik tebal berbagai ukuran',
    image: '/images/kandang1.jpg',
    variants: [
      { name: 'Ukuran Kecil', price: 30000, stock: 7, image: '/images/kandang1.jpg' },
      { name: 'Ukuran Sedang', price: 40000, stock: 7, image: '/images/kandang1.jpg' },
      { name: 'Ukuran Besar', price: 50000, stock: 6, image: '/images/kandang1.jpg' }
    ]
  },
  {
    id: 30,
    name: 'Kandang Besi Lipat Large',
    price: 230000,
    stock: 6,
    category: 'Kandang Kucing',
    description: 'Kandang kawat lipat kokoh anti karat',
    image: '/images/kandang2.jpg'
  },
  {
    id: 31,
    name: 'Kandang Besi Portabel',
    price: 110000,
    stock: 9,
    category: 'Kandang Kucing',
    description: 'Kandang ringkas ideal untuk anak kucing',
    image: '/images/kandang3.jpg'
  }
];

export const getStoredProducts = (): Product[] => {
  if (typeof window === 'undefined') {
    return products;
  }

  try {
    const rawProducts = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (!rawProducts) {
      return products;
    }

    const parsed = JSON.parse(rawProducts);
    if (!Array.isArray(parsed)) {
      return products;
    }

    const isValid = parsed.every((item) =>
      item &&
      typeof item.id === 'number' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      typeof item.stock === 'number' &&
      typeof item.category === 'string' &&
      typeof item.description === 'string' &&
      typeof item.image === 'string' &&
      (
        item.variants === undefined ||
        (
          Array.isArray(item.variants) &&
          item.variants.every((variant: any) =>
            variant &&
            typeof variant.name === 'string' &&
            typeof variant.price === 'number' &&
            typeof variant.stock === 'number' &&
            (variant.image === undefined || typeof variant.image === 'string')
          )
        )
      )
    );

    if (!isValid) {
      return products;
    }

    const storedProducts = parsed as Product[];
    const deletedIdsRaw = localStorage.getItem(DELETED_PRODUCT_IDS_KEY);
    const deletedIds = new Set<number>(
      deletedIdsRaw ? (JSON.parse(deletedIdsRaw) as number[]) : []
    );
    const storedById = new Map(storedProducts.map((product) => [product.id, product]));

    const mergedDefaults = products.map((defaultProduct) => {
      if (deletedIds.has(defaultProduct.id)) {
        return null;
      }

      const storedProduct = storedById.get(defaultProduct.id);
      if (!storedProduct) {
        return defaultProduct;
      }

      if (!defaultProduct.variants?.length) {
        return {
          ...defaultProduct,
          ...storedProduct,
        };
      }

      const mergedVariants = defaultProduct.variants.map((defaultVariant) => {
        const storedVariant = storedProduct.variants?.find((variant) => variant.name === defaultVariant.name);
        return storedVariant
          ? {
              ...defaultVariant,
              ...storedVariant,
              image: defaultVariant.image ?? storedVariant.image,
            }
          : defaultVariant;
      });

      return {
        ...defaultProduct,
        ...storedProduct,
        variants: mergedVariants,
      };
    });

    const extraStoredProducts = storedProducts.filter(
      (storedProduct) =>
        !products.some((defaultProduct) => defaultProduct.id === storedProduct.id) &&
        !deletedIds.has(storedProduct.id)
    );

    return [...mergedDefaults.filter((product): product is Product => Boolean(product)), ...extraStoredProducts];
  } catch {
    return products;
  }
};
