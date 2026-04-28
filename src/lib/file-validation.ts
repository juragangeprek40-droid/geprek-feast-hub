export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Format tidak didukung. Gunakan: ${ALLOWED_IMAGE_EXTENSIONS.join(", ").toUpperCase()}.`,
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `Ukuran ${sizeMb} MB melebihi batas ${MAX_IMAGE_SIZE_MB} MB.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, error: "File kosong." };
  }
  return { valid: true };
}
