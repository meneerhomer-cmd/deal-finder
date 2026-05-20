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
  quantity: string | null;
  unitPrice: string | null;
  brand: string | null;
  conditions: string | null;
  minPurchase: string | null;
  variants: string | null;
  loyaltyCard: string | null;
  department: string | null;
  validDays: string | null;
  validFrom: string | null;
  validUntil: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  expired: boolean;
  daysExpired: number;
  expiringSoon: boolean;
  lowestPriceSeen: number | null;
  atLowestPrice: boolean;
  fingerprint?: string | null;
  derivedUnitPrice?: number | null;
  derivedUnitLabel?: string | null;
}

export interface Opportunity {
  fingerprint: string;
  canonicalName: string;
  canonicalImageUrl: string | null;
  category: string | null;
  cheapestRetailer: string;
  currentPrice: number;
  expectedPrice: number;
  savingEur: number;
  discountPercentage: number | null;
}

export interface Product {
  fingerprint: string;
  category: string | null;
  brand: string | null;
  productLine: string | null;
  style: string | null;
  variantFamily: string | null;
  canonicalName: string;
  canonicalImageUrl: string | null;
  categoryAttributesJson: string | null;
  dealCount: number;
  retailerCount: number;
  minCurrentPrice: number | null;
}

export interface ProductResponse {
  product: Product;
  deals: Deal[];
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
  { slug: 'kleding', name: 'Kleding', emoji: '👕' },
  { slug: 'elektronica', name: 'Elektronica', emoji: '📱' },
  { slug: 'keuken', name: 'Keuken & Apparaten', emoji: '🍳' },
  { slug: 'tuin', name: 'Tuin & Buiten', emoji: '🌱' },
  { slug: 'vrije-tijd', name: 'Vrije Tijd', emoji: '🎢' },
  { slug: 'doe-het-zelf', name: 'Doe-het-zelf', emoji: '🔧' },
  { slug: 'auto', name: 'Auto', emoji: '🚗' },
  { slug: 'andere', name: 'Andere', emoji: '📦' },
];

export const FOOD_SLUGS = new Set([
  'vlees', 'vis', 'zuivel', 'kaas', 'charcuterie', 'groenten', 'fruit',
  'dranken', 'bier', 'wijn', 'snoep', 'chips', 'ontbijt', 'brood',
  'diepvries', 'conserven', 'pasta', 'sauzen', 'kruiden',
  // Two of the five launch categories live under the "non-food" taxonomy:
  // detergent (huishouden) and diapers (baby). Surface them at launch.
  'huishouden', 'baby'
]);

export const FOOD_CATEGORIES = CATEGORIES.filter(c => FOOD_SLUGS.has(c.slug));
export const NON_FOOD_CATEGORIES = CATEGORIES.filter(c => !FOOD_SLUGS.has(c.slug));

export function isFoodDeal(deal: Deal): boolean {
  if (deal.categorySlug) return FOOD_SLUGS.has(deal.categorySlug);
  // ~600 deals have a null categorySlug but a correct extracted category.
  // Non-food deals get a null fingerprint at extraction time, so a present
  // fingerprint means the extractor classified this as an in-scope (food /
  // launch) product — trust it when the coarse categorySlug is missing.
  return !!deal.fingerprint;
}

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

