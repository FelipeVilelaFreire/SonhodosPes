export function normalizeText(str: string | number | null | undefined): string {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function padCodigo(codigo: string | number, length = 5): string {
  return String(codigo).padStart(length, '0');
}

export function isAllDigits(str: string): boolean {
  return /^\d+$/.test(str);
}
