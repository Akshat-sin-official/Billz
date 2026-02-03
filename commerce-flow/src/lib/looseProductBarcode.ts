/** Prefix for loose product barcodes. Format: LOOSE-{productId}-{weight} */
export const LOOSE_BARCODE_PREFIX = 'LOOSE-';

/** Prefix for manually entered labels. Format: MANUAL-{labelId} */
export const MANUAL_BARCODE_PREFIX = 'MANUAL-';

export function createLooseProductBarcode(productId: string, weight: number): string {
  return `${LOOSE_BARCODE_PREFIX}${productId}-${weight.toFixed(3)}`;
}

export function parseLooseProductBarcode(
  barcode: string
): { productId: string; weight: number } | null {
  if (!barcode.startsWith(LOOSE_BARCODE_PREFIX)) return null;
  const rest = barcode.slice(LOOSE_BARCODE_PREFIX.length);
  const lastDash = rest.lastIndexOf('-');
  if (lastDash === -1) return null;
  const productId = rest.slice(0, lastDash);
  const weightStr = rest.slice(lastDash + 1);
  const weight = parseFloat(weightStr);
  if (isNaN(weight) || weight <= 0) return null;
  return { productId, weight };
}

export function createManualBarcode(labelId: string): string {
  return `${MANUAL_BARCODE_PREFIX}${labelId}`;
}

export function parseManualBarcode(barcode: string): string | null {
  if (!barcode.startsWith(MANUAL_BARCODE_PREFIX)) return null;
  return barcode.slice(MANUAL_BARCODE_PREFIX.length) || null;
}
