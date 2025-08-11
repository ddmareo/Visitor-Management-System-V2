const PROVINCE_CODES: Record<string, string> = {
  "11": "Aceh",
  "12": "Sumatera Utara",
  "13": "Sumatera Barat",
  "14": "Riau",
  "15": "Jambi",
  "16": "Sumatera Selatan",
  "17": "Bengkulu",
  "18": "Lampung",
  "19": "Kepulauan Bangka Belitung",
  "21": "Kepulauan Riau",
  "31": "DKI Jakarta",
  "32": "Jawa Barat",
  "33": "Jawa Tengah",
  "34": "DI Yogyakarta",
  "35": "Jawa Timur",
  "36": "Banten",
  "51": "Bali",
  "52": "Nusa Tenggara Barat",
  "53": "Nusa Tenggara Timur",
  "61": "Kalimantan Barat",
  "62": "Kalimantan Tengah",
  "63": "Kalimantan Selatan",
  "64": "Kalimantan Timur",
  "65": "Kalimantan Utara",
  "71": "Sulawesi Utara",
  "72": "Sulawesi Tengah",
  "73": "Sulawesi Selatan",
  "74": "Sulawesi Tenggara",
  "75": "Gorontalo",
  "76": "Sulawesi Barat",
  "81": "Maluku",
  "82": "Maluku Utara",
  "91": "Papua Barat",
  "92": "Papua",
};

// Check if area code exists
const validAreaCodes = [
  "A",
  "AA",
  "AB",
  "AD",
  "AE",
  "AG",
  "B",
  "BA",
  "BB",
  "BD",
  "BE",
  "BG",
  "BH",
  "BK",
  "BL",
  "BM",
  "BN",
  "BP",
  "BR",
  "BS",
  "BT",
  "BU",
  "BW",
  "BY",
  "BZ",
  "D",
  "DA",
  "DB",
  "DD",
  "DE",
  "DG",
  "DH",
  "DK",
  "DL",
  "DM",
  "DN",
  "DP",
  "DR",
  "DS",
  "DT",
  "DW",
  "DX",
  "DY",
  "E",
  "EA",
  "EB",
  "ED",
  "F",
  "G",
  "H",
  "K",
  "KB",
  "KH",
  "KR",
  "KS",
  "KT",
  "KU",
  "L",
  "M",
  "N",
  "P",
  "PA",
  "PB",
  "R",
  "S",
  "T",
  "W",
  "Z",
];

export const passportLocales = [
  'AM', 'AR', 'AT', 'AU', 'AZ', 'BE', 'BG', 'BY', 'BR', 'CA', 'CH', 'CN', 
  'CY', 'CZ', 'DE', 'DK', 'DZ', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 
  'HU', 'IE', 'IN', 'IR', 'IS', 'IT', 'JM', 'JP', 'KR', 'KZ', 'LI', 
  'LT', 'LU', 'LV', 'LY', 'MT', 'MX', 'MY', 'MZ', 'NL', 'NZ', 'PH', 'PK', 
  'PL', 'PT', 'RO', 'RU', 'SE', 'SL', 'SK', 'TH', 'TR', 'UA', 'US', 'ZA'
] as const;

/**
 * Validates an Indonesian NIK (Nomor Induk Kependudukan).
 */
export function isValidNIK(nik: string): boolean {
  if (!/^\d{16}$/.test(nik)) return false;

  if (/^(\d)\1+$/.test(nik)) return false;

  const provinceCode = nik.slice(0, 2);
  const locationCode = nik.slice(0, 6);
  const dobPart = nik.slice(6, 12);
  const sequence = nik.slice(12);

  if (!PROVINCE_CODES[provinceCode]) return false;

  if (/^0+$/.test(locationCode)) return false;

  const rawDay = parseInt(dobPart.slice(0, 2), 10);
  const month = parseInt(dobPart.slice(2, 4), 10);

  const day = rawDay > 40 ? rawDay - 40 : rawDay;

  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;

  if (/^0+$/.test(sequence)) return false;

  return true;
}

/**
 * Validates an email address.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates Indonesian license plate number (Plat Nomor).
 * Accepts any format like "b1223po", "B 1223 PO", "b-1223-po" etc.
 * and validates it as the standard format.
 */
export function isValidPlatNomor(platNomor: string): boolean {
  // Remove all spaces, dashes, and convert to uppercase
  const cleanPlat = platNomor
    .trim()
    .toUpperCase()
    .replace(/[\s\-]/g, "");

  // Pattern to match: 1-2 letters + 1-4 digits + 1-3 letters
  const platPattern = /^([A-Z]{1,2})(\d{1,4})([A-Z]{1,3})$/;
  const match = cleanPlat.match(platPattern);

  if (!match) return false;

  const [, areaCode] = match;

  return validAreaCodes.includes(areaCode);
}

/**
 * Formats Indonesian license plate number to standard format.
 * Converts "b1223po" to "B 1223 PO", returns null if invalid format.
 */
export function formatPlatNomor(platNomor: string): string | null {
  // Remove all spaces, dashes, and convert to uppercase
  const cleanPlat = platNomor
    .trim()
    .toUpperCase()
    .replace(/[\s\-]/g, "");

  // Pattern to match: 1-2 letters + 1-4 digits + 1-3 letters
  const platPattern = /^([A-Z]{1,2})(\d{1,4})([A-Z]{1,3})$/;
  const match = cleanPlat.match(platPattern);

  if (!match) return null;

  const [, areaCode, numbers, letters] = match;

  if (!validAreaCodes.includes(areaCode)) return null;

  // Return formatted string: "AREA NUMBERS LETTERS"
  return `${areaCode} ${numbers} ${letters}`;
}

export function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}
