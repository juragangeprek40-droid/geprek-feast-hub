import { useSyncExternalStore } from "react";

export type SpiceLevel = "tidak_pedas" | "sedang" | "pedas" | "extra_pedas";

export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  category: "paket" | "satuan" | "minuman";
  quantity: number;
  spiceLevel: SpiceLevel;
  extras: string;
  minPortion: number;
}

const STORAGE_KEY = "egeprek-cart";

let cart: CartItem[] = [];
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cart = JSON.parse(raw);
  } catch {}
}

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }
  listeners.forEach((l) => l());
}

export const cartStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot() {
    return cart;
  },
  add(item: CartItem) {
    cart = [...cart, { ...item, quantity: Math.max(item.quantity, item.minPortion) }];
    persist();
  },
  update(index: number, patch: Partial<CartItem>) {
    cart = cart.map((c, i) => (i === index ? { ...c, ...patch } : c));
    persist();
  },
  remove(index: number) {
    cart = cart.filter((_, i) => i !== index);
    persist();
  },
  clear() {
    cart = [];
    persist();
  },
};

export function useCart() {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    () => [] as CartItem[]
  );
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}
