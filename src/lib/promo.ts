export interface PromoFields {
  price: number;
  promo_price?: number | null;
  promo_start_at?: string | null;
  promo_end_at?: string | null;
}

export function isPromoActive(m: PromoFields, now: Date = new Date()): boolean {
  if (!m.promo_price || m.promo_price <= 0) return false;
  if (m.promo_price >= m.price) return false;
  const start = m.promo_start_at ? new Date(m.promo_start_at) : null;
  const end = m.promo_end_at ? new Date(m.promo_end_at) : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

export function effectivePrice(m: PromoFields): number {
  return isPromoActive(m) ? Number(m.promo_price) : Number(m.price);
}

export function discountPercent(m: PromoFields): number {
  if (!isPromoActive(m)) return 0;
  return Math.round((1 - Number(m.promo_price) / Number(m.price)) * 100);
}
