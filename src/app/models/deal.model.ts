export interface Deal {
  id: number;
  productName: string;
  retailerName: string;
  retailerSlug: string;
  retailerLogoUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercentage: number;
  dealType: string | null;
  validFrom: string | null;
  validUntil: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  expired: boolean;
  daysExpired: number;
  expiringSoon: boolean;
}

export interface Retailer {
  id: number;
  slug: string;
  name: string;
  colorHex: string;
  active: boolean;
  dealCount: number;
}

export interface Category {
  slug: string;
  name: string;
  emoji: string;
}

export interface ScanStatus {
  scanning: boolean;
  lastStatus: string;
  lastScanTime: string | null;
  totalDeals: number;
  totalFolders: number;
}

// Category definitions with emojis
export const CATEGORIES: Category[] = [
  { slug: 'vlees', name: 'Vlees', emoji: '🥩' },
  { slug: 'vis', name: 'Vis', emoji: '🐟' },
  { slug: 'zuivel', name: 'Zuivel', emoji: '🥛' },
  { slug: 'kaas', name: 'Kaas', emoji: '🧀' },
  { slug: 'charcuterie', name: 'Charcuterie', emoji: '🥓' },
  { slug: 'groenten', name: 'Groenten', emoji: '🥬' },
  { slug: 'fruit', name: 'Fruit', emoji: '🍎' },
  { slug: 'dranken', name: 'Dranken', emoji: '🥤' },
  { slug: 'bier', name: 'Bier', emoji: '🍺' },
  { slug: 'wijn', name: 'Wijn', emoji: '🍷' },
  { slug: 'snoep', name: 'Snoep', emoji: '🍬' },
  { slug: 'chips', name: 'Chips', emoji: '🍿' },
  { slug: 'ontbijt', name: 'Ontbijt', emoji: '🥣' },
  { slug: 'brood', name: 'Brood', emoji: '🍞' },
  { slug: 'diepvries', name: 'Diepvries', emoji: '🧊' },
  { slug: 'conserven', name: 'Conserven', emoji: '🥫' },
  { slug: 'pasta', name: 'Pasta', emoji: '🍝' },
  { slug: 'sauzen', name: 'Sauzen', emoji: '🫙' },
  { slug: 'kruiden', name: 'Kruiden', emoji: '🧂' },
  { slug: 'huishouden', name: 'Huishouden', emoji: '🏠' },
  { slug: 'schoonmaak', name: 'Schoonmaak', emoji: '🧹' },
  { slug: 'verzorging', name: 'Verzorging', emoji: '🧴' },
  { slug: 'baby', name: 'Baby', emoji: '👶' },
  { slug: 'huisdier', name: 'Huisdier', emoji: '🐕' },
  { slug: 'andere', name: 'Andere', emoji: '📦' },
];

export function getCategoryEmoji(categorySlug: string | null): string {
  if (!categorySlug) return '📦';
  const cat = CATEGORIES.find(c => c.slug === categorySlug.toLowerCase());
  return cat?.emoji ?? '📦';
}

export function getDiscountClass(discount: number): string {
  if (discount >= 50) return 'multi-buy';
  if (discount >= 30) return 'percentage';
  if (discount >= 20) return 'fixed-price';
  return 'price-drop';
}

