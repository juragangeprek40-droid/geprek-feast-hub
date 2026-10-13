// Browser-safe helper: remembers the delivery details a customer last used
// on this device, so checkout can fill them in automatically next time.

const STORAGE_KEY = "egeprek-delivery-info";

export interface DeliveryInfo {
  name: string;
  phone: string;
  address: string;
}

const EMPTY: DeliveryInfo = { name: "", phone: "", address: "" };

export function loadDeliveryInfo(): DeliveryInfo {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<DeliveryInfo>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      address: typeof parsed.address === "string" ? parsed.address : "",
    };
  } catch {
    return EMPTY;
  }
}

export function saveDeliveryInfo(info: Partial<DeliveryInfo>) {
  if (typeof window === "undefined") return;
  try {
    const current = loadDeliveryInfo();
    const next: DeliveryInfo = {
      name: info.name?.trim() || current.name,
      phone: info.phone?.trim() || current.phone,
      address: info.address?.trim() || current.address,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode etc.) — autofill simply won't persist.
  }
}
