import { calculateDiscount, OrderItem, PromoCode } from '../src/discount';

const NOW = new Date('2026-04-28T12:00:00Z');
const FUTURE = new Date('2026-12-31T00:00:00Z');
const PAST = new Date('2026-01-01T00:00:00Z');

function item(price: number, quantity = 1, productId = 'sku-1'): OrderItem {
  return { productId, price, quantity };
}

describe('calculateDiscount', () => {
  it('should_cap_discount_at_1000_when_total_exceeds_threshold', () => {
    // catches bug 1: ceiling of 1000 копеек is not applied
    const result = calculateDiscount([item(50000)], null, NOW);
    expect(result.discountAmount).toBe(1000);
    expect(result.finalTotal).toBe(49000);
    expect(result.appliedRule).toBe('percentage');
  });

  it('should_ignore_promo_when_expired', () => {
    // catches bug 2: expired promo (expiresAt < now) must be ignored
    const expired: PromoCode = {
      code: 'OLD',
      type: 'fixed',
      value: 500,
      expiresAt: PAST,
    };
    const result = calculateDiscount([item(3000)], expired, NOW);
    expect(result.discountAmount).toBe(0);
    expect(result.appliedRule).toBe('none');
    expect(result.finalTotal).toBe(3000);
  });

  it('should_apply_max_discount_when_percent_and_promo_both_match', () => {
    // catches bug 3: discounts are summed instead of taking the larger one
    const promo: PromoCode = {
      code: 'NEW',
      type: 'fixed',
      value: 200,
      expiresAt: FUTURE,
    };
    const result = calculateDiscount([item(10000)], promo, NOW);
    expect(result.discountAmount).toBe(1000);
    expect(result.finalTotal).toBe(9000);
  });

  it('should_throw_when_total_is_zero', () => {
    // catches bug 4: total === 0 must be rejected, not just total < 0
    expect(() => calculateDiscount([item(0)], null, NOW)).toThrow();
  });

  it('should_return_integer_kopecks_for_percent_promo', () => {
    // catches bug 5: discount must be rounded to whole копейки
    const promo: PromoCode = {
      code: 'P30',
      type: 'percent',
      value: 30,
      expiresAt: FUTURE,
    };
    const result = calculateDiscount([item(333)], promo, NOW);
    expect(Number.isInteger(result.discountAmount)).toBe(true);
  });

  it('should_throw_when_cart_is_empty', () => {
    // positive: empty cart raises
    expect(() => calculateDiscount([], null, NOW)).toThrow();
  });

  it('should_apply_no_discount_when_total_below_threshold_and_no_promo', () => {
    // positive: below 5000 with no promo => no discount
    const result = calculateDiscount([item(4999)], null, NOW);
    expect(result.discountAmount).toBe(0);
    expect(result.finalTotal).toBe(4999);
    expect(result.appliedRule).toBe('none');
  });

  it('should_apply_fixed_promo_when_valid_and_below_threshold', () => {
    // positive: valid fixed promo on a below-threshold cart applies cleanly
    const promo: PromoCode = {
      code: 'NICE',
      type: 'fixed',
      value: 500,
      expiresAt: FUTURE,
    };
    const result = calculateDiscount([item(3000)], promo, NOW);
    expect(result.discountAmount).toBe(500);
    expect(result.finalTotal).toBe(2500);
    expect(result.appliedRule).toBe('promo');
  });
});
