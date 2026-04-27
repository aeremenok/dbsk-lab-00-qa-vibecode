export interface OrderItem {
  productId: string;
  price: number;
  quantity: number;
}

export interface PromoCode {
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  expiresAt: Date;
}

export interface DiscountResult {
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  appliedRule: 'percentage' | 'promo' | 'none';
}

export function calculateDiscount(
  items: OrderItem[],
  promo: PromoCode | null,
  now: Date
): DiscountResult {
  if (items.length === 0) {
    throw new Error('Cart is empty');
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (total < 0) {
    throw new Error('Invalid order total');
  }

  let percentDiscount = 0;
  if (total >= 5000) {
    percentDiscount = total * 0.1;
  }

  let promoDiscount = 0;
  if (promo) {
    if (promo.type === 'fixed') {
      promoDiscount = promo.value;
    } else if (promo.type === 'percent') {
      promoDiscount = total * (promo.value / 100);
    }
  }

  const discountAmount = percentDiscount + promoDiscount;

  let appliedRule: 'percentage' | 'promo' | 'none' = 'none';
  if (promoDiscount > 0) {
    appliedRule = 'promo';
  } else if (percentDiscount > 0) {
    appliedRule = 'percentage';
  }

  return {
    originalTotal: total,
    discountAmount,
    finalTotal: total - discountAmount,
    appliedRule,
  };
}
