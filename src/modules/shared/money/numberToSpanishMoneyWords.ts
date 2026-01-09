// src/modules/shared/money/numberToSpanishMoneyWords.ts

/**
 * Converts a decimal amount to Spanish (MX) money words in uppercase.
 * Example: "5800.00" -> "CINCO MIL OCHOCIENTOS PESOS 00/100 M.N."
 *
 * Notes:
 * - Designed for Prisma Decimal string outputs (e.g. "1234.50").
 * - Handles up to 999,999,999 pesos.
 * - Uses masculine "UN" before "PESO(S)".
 * - Output is uppercase and without accents for simplicity/stability.
 */
export function numberToSpanishMoneyWords(amount: string | number): string {
  const normalized = normalizeAmount(amount);

  const negative = normalized.negative;
  const pesos = normalized.pesos; // integer string
  const cents = normalized.cents; // "00".."99"

  const pesosNumber = Number(pesos);
  if (
    !Number.isFinite(pesosNumber) ||
    pesosNumber < 0 ||
    pesosNumber > 999_999_999
  ) {
    // If you need bigger ranges, expand the converter (billions, etc.)
    throw new Error(
      "numberToSpanishMoneyWords: amount out of supported range."
    );
  }

  const pesosWords = integerToSpanishWords(pesosNumber);

  const pesoLabel = pesosNumber === 1 ? "PESO" : "PESOS";
  const signPrefix = negative ? "MENOS " : "";

  return `${signPrefix}${pesosWords} ${pesoLabel} ${cents}/100 M.N.`;
}

function normalizeAmount(amount: string | number): {
  negative: boolean;
  pesos: string;
  cents: string;
} {
  const raw = String(amount).trim();

  // Remove common formatting (commas, spaces)
  const cleaned = raw.replace(/,/g, "").replace(/\s+/g, "");

  const negative = cleaned.startsWith("-");
  const unsigned = negative ? cleaned.slice(1) : cleaned;

  const [intPartRaw, decPartRaw] = unsigned.split(".");
  const intPart = (intPartRaw ?? "0").replace(/^0+(?=\d)/, "") || "0";

  // We only keep 2 decimals (rounding is optional; here we truncate to be stable).
  const dec = (decPartRaw ?? "").padEnd(2, "0").slice(0, 2);
  const cents = /^\d{2}$/.test(dec) ? dec : "00";

  if (!/^\d+$/.test(intPart)) {
    throw new Error("numberToSpanishMoneyWords: invalid amount.");
  }

  return { negative, pesos: intPart, cents };
}

function integerToSpanishWords(n: number): string {
  if (n === 0) return "CERO";

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const hundreds = n % 1_000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push("UN MILLON");
    else parts.push(`${convert999(millions)} MILLONES`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push("MIL");
    else parts.push(`${convert999(thousands)} MIL`);
  }

  if (hundreds > 0) {
    parts.push(convert999(hundreds));
  }

  // Apply masculine "UN" adjustment at the very end (before PESO(S)).
  // Examples: "VEINTIUNO" -> "VEINTIUN", "TREINTA Y UNO" -> "TREINTA Y UN"
  return fixMasculineUno(parts.join(" ").trim());
}

function convert999(n: number): string {
  if (n <= 0 || n > 999) throw new Error("convert999: out of range");

  const hundreds = Math.floor(n / 100);
  const rest = n % 100;

  const hundredsWords = [
    "", // 0
    "CIENTO",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
  ];

  if (n === 100) return "CIEN";

  const parts: string[] = [];
  if (hundreds > 0) parts.push(hundredsWords[hundreds]);
  if (rest > 0) parts.push(convert99(rest));

  return parts.join(" ");
}

function convert99(n: number): string {
  if (n <= 0 || n > 99) throw new Error("convert99: out of range");

  const units = [
    "",
    "UNO",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
  ];

  const teens: Record<number, string> = {
    10: "DIEZ",
    11: "ONCE",
    12: "DOCE",
    13: "TRECE",
    14: "CATORCE",
    15: "QUINCE",
    16: "DIECISEIS",
    17: "DIECISIETE",
    18: "DIECIOCHO",
    19: "DIECINUEVE",
  };

  const tensWords: Record<number, string> = {
    2: "VEINTE",
    3: "TREINTA",
    4: "CUARENTA",
    5: "CINCUENTA",
    6: "SESENTA",
    7: "SETENTA",
    8: "OCHENTA",
    9: "NOVENTA",
  };

  if (n < 10) return units[n];
  if (n >= 10 && n <= 19) return teens[n];

  const tens = Math.floor(n / 10);
  const unit = n % 10;

  if (tens === 2) {
    if (unit === 0) return "VEINTE";
    // Common receipt style: VEINTIUNO, VEINTIDOS, ...
    return `VEINTI${units[unit]}`;
  }

  const tensPart = tensWords[tens] ?? "";
  if (unit === 0) return tensPart;

  return `${tensPart} Y ${units[unit]}`;
}

/**
 * Adjusts ending "UNO" to masculine "UN" for money context.
 * - "VEINTIUNO" -> "VEINTIUN"
 * - "TREINTA Y UNO" -> "TREINTA Y UN"
 * - "CIENTO UNO" -> "CIENTO UN"
 *
 * We do NOT change "UN MILLON" (already correct) or internal "UNO" not at the end.
 */
function fixMasculineUno(words: string): string {
  // Replace ending "... Y UNO" -> "... Y UN"
  if (words.endsWith(" Y UNO")) return words.slice(0, -5) + "UN";

  // Replace ending "... VEINTIUNO" -> "... VEINTIUN"
  if (words.endsWith("VEINTIUNO")) return words.slice(0, -3); // remove "UNO" -> leaves "VEINTI"

  // Replace ending "... UNO" -> "... UN"
  if (words.endsWith(" UNO")) return words.slice(0, -3) + "UN";

  return words;
}
