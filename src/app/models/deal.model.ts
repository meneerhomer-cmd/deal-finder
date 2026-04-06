export interface Deal {
  id: number;
  productName: string;
  brand: string | null;
  category: string | null;
  dealType: string;
  promoKind: PromoKind;
  effectiveDiscount: number;
  price: number | null;
  originalPrice: number | null;
  quantity: string | null;
  retailerSlug: string;
  retailerName: string;
  validFrom: string | null;
  validUntil: string | null;
  pageNumber: number | null;
  expired: boolean;
  expiringSoon: boolean;
}

export type PromoKind = 'MULTI_BUY' | 'PERCENTAGE' | 'FIXED_PRICE' | 'PRICE_DROP';

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

export function getCategoryEmoji(slug: string | null): string {
  if (!slug) return '📦';
  const cat = CATEGORIES.find(c => c.slug === slug.toLowerCase());
  return cat?.emoji ?? '📦';
}

export function getPromoKindClass(kind: PromoKind): string {
  switch (kind) {
    case 'MULTI_BUY': return 'multi-buy';
    case 'PERCENTAGE': return 'percentage';
    case 'FIXED_PRICE': return 'fixed-price';
    case 'PRICE_DROP': return 'price-drop';
    default: return '';
  }
}
