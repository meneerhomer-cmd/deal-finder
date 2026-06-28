import { describe, it, expect } from 'vitest';
import {
  Deal,
  FOOD_SLUGS,
  looksNonFood,
  isFoodDeal,
  getCategoryEmoji,
  getDiscountClass,
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
