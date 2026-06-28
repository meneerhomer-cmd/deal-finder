import { describe, it, expect } from 'vitest';
import {
  Deal,
  FOOD_SLUGS,
  looksNonFood,
  isFoodDeal,
  getCategoryEmoji,
  getDiscountClass,
  savingEur,
  matchesFilters,
} from './deal.model';

// Minimal Deal factory — only the fields the pure helpers read.
function deal(partial: Partial<Deal>): Deal {
  return {
    productName: '',
    brand: null,
    categorySlug: null,
    fingerprint: null,
    ...partial,
  } as Deal;
}

describe('looksNonFood', () => {
  it('flags cologne / personal-care names that the keyword categorizer mislabels', () => {
    expect(looksNonFood(deal({ productName: 'Davidoff Cool Water', brand: 'Davidoff' }))).toBe(true);
    expect(looksNonFood(deal({ productName: 'Axe deodorant 150ml' }))).toBe(true);
    expect(looksNonFood(deal({ productName: 'Dior Eau de Parfum' }))).toBe(true);
  });

  it('flags bedding / textile names', () => {
    expect(looksNonFood(deal({ productName: 'Jersey hoeslaken 90x200' }))).toBe(true);
    expect(looksNonFood(deal({ productName: 'Dekbed 240x220' }))).toBe(true);
    expect(looksNonFood(deal({ productName: 'Badhanddoek set' }))).toBe(true);
  });

  it('matches case-insensitively across name and brand', () => {
    expect(looksNonFood(deal({ productName: 'COOL WATER', brand: 'Davidoff' }))).toBe(true);
    expect(looksNonFood(deal({ productName: 'Spray', brand: 'Cool Water' }))).toBe(true);
  });

  it('does not flag genuine food', () => {
    expect(looksNonFood(deal({ productName: 'Spa Reine water 6x1.5L' }))).toBe(false);
    expect(looksNonFood(deal({ productName: 'Coca-Cola Zero' }))).toBe(false);
  });
});

describe('isFoodDeal', () => {
  it('returns false for non-food patterns regardless of category', () => {
    expect(isFoodDeal(deal({ productName: 'Cool Water', categorySlug: 'dranken' }))).toBe(false);
  });

  it('trusts a food categorySlug', () => {
    expect(isFoodDeal(deal({ productName: 'Gehakt', categorySlug: 'vlees' }))).toBe(true);
    expect(isFoodDeal(deal({ productName: 'Pampers', categorySlug: 'baby' }))).toBe(true); // launch category
    expect(isFoodDeal(deal({ productName: 'Dreft', categorySlug: 'huishouden' }))).toBe(true);
  });

  it('rejects a non-food categorySlug', () => {
    expect(isFoodDeal(deal({ productName: 'Boormachine', categorySlug: 'gereedschap' }))).toBe(false);
  });

  it('falls back to fingerprint presence when categorySlug is null', () => {
    expect(isFoodDeal(deal({ productName: 'Innocent fruitsap', fingerprint: 'fruit:sap:innocent:innocent:standard' }))).toBe(true);
    expect(isFoodDeal(deal({ productName: 'Mystery item', fingerprint: null }))).toBe(false);
  });

  it('keeps every food slug in scope', () => {
    for (const slug of FOOD_SLUGS) {
      expect(isFoodDeal(deal({ productName: 'x', categorySlug: slug }))).toBe(true);
    }
  });
});

describe('getCategoryEmoji', () => {
  it('returns the box fallback for null/unknown slugs', () => {
    expect(getCategoryEmoji(null)).toBe('📦');
    expect(getCategoryEmoji('does-not-exist')).toBe('📦');
  });

  it('is case-insensitive', () => {
    expect(getCategoryEmoji('VLEES')).toBe(getCategoryEmoji('vlees'));
  });

  it('returns a non-fallback emoji for a known slug', () => {
    expect(getCategoryEmoji('vlees')).not.toBe('📦');
  });
});

describe('getDiscountClass', () => {
  it('buckets by discount magnitude at the documented thresholds', () => {
    expect(getDiscountClass(60)).toBe('multi-buy');
    expect(getDiscountClass(50)).toBe('multi-buy');
    expect(getDiscountClass(49)).toBe('percentage');
    expect(getDiscountClass(30)).toBe('percentage');
    expect(getDiscountClass(29)).toBe('fixed-price');
    expect(getDiscountClass(20)).toBe('fixed-price');
    expect(getDiscountClass(19)).toBe('price-drop');
    expect(getDiscountClass(0)).toBe('price-drop');
  });
});

describe('savingEur', () => {
  it('is original minus current price', () => {
    expect(savingEur(deal({ originalPrice: 8.99, currentPrice: 6.49 }))).toBeCloseTo(2.5, 5);
  });

  it('is 0 when original price is unknown (sorts last under besparing)', () => {
    expect(savingEur(deal({ originalPrice: null, currentPrice: 3.0 }))).toBe(0);
  });

  it('is 0 when current price is unknown', () => {
    expect(savingEur(deal({ originalPrice: 5.0, currentPrice: null }))).toBe(0);
  });

  it('never goes negative when the promo is not actually cheaper', () => {
    expect(savingEur(deal({ originalPrice: 2.0, currentPrice: 3.0 }))).toBe(0);
  });

  it('orders deals by descending saving when used as a comparator', () => {
    const deals = [
      deal({ productName: 'small', originalPrice: 3, currentPrice: 2.5 }), // 0.5
      deal({ productName: 'big', originalPrice: 10, currentPrice: 4 }),    // 6
      deal({ productName: 'none', originalPrice: null, currentPrice: 4 }), // 0
    ];
    const sorted = [...deals].sort((a, b) => savingEur(b) - savingEur(a)).map(d => d.productName);
    expect(sorted).toEqual(['big', 'small', 'none']);
  });
});

describe('matchesFilters', () => {
  const base = () =>
    deal({
      productName: 'Dreft Wasmiddel',
      brand: 'Dreft',
      retailerSlug: 'kruidvat',
      categorySlug: 'huishouden',
      discountPercentage: 30,
      atLowestPrice: false,
    });

  it('passes a deal with no filters set', () => {
    expect(matchesFilters(base(), {})).toBe(true);
  });

  it('filters by retailer / category / brand / minDiscount', () => {
    expect(matchesFilters(base(), { retailer: 'lidl' })).toBe(false);
    expect(matchesFilters(base(), { category: 'vlees' })).toBe(false);
    expect(matchesFilters(base(), { brand: 'ariel' })).toBe(false);
    expect(matchesFilters(base(), { minDiscount: 40 })).toBe(false);
    expect(matchesFilters(base(), { minDiscount: 30 })).toBe(true);
  });

  it('search matches the product name OR the brand', () => {
    // brand-only term that is NOT in the product name still hits
    expect(matchesFilters(deal({ productName: 'Vloeibaar wasmiddel', brand: 'Dreft' }), { search: 'dreft' })).toBe(true);
    expect(matchesFilters(deal({ productName: 'Dreft Wasmiddel', brand: null }), { search: 'wasmiddel' })).toBe(true);
    expect(matchesFilters(deal({ productName: 'Wasmiddel', brand: 'Ariel' }), { search: 'dreft' })).toBe(false);
  });

  it('atLowestOnly keeps only deals at their lowest recorded price', () => {
    expect(matchesFilters(deal({ atLowestPrice: true }), { atLowestOnly: true })).toBe(true);
    expect(matchesFilters(deal({ atLowestPrice: false }), { atLowestOnly: true })).toBe(false);
    // toggle off -> does not exclude
    expect(matchesFilters(deal({ atLowestPrice: false }), { atLowestOnly: false })).toBe(true);
  });

  it('combines filters with AND semantics', () => {
    expect(matchesFilters(base(), { retailer: 'kruidvat', minDiscount: 25, search: 'dreft' })).toBe(true);
    expect(matchesFilters(base(), { retailer: 'kruidvat', atLowestOnly: true })).toBe(false); // base is not at lowest
  });
});
