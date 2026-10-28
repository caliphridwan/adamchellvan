import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";
import { parseFavourites } from "@/lib/favourites";
import { detectFileType } from "@/lib/file-type";
import { can } from "@/lib/permissions";
import { formatArea, formatPrice, paragraphs, slugify, textBlocks, titledLines, whatsappLink } from "@/lib/utils";

describe("permissions", () => {
  it("restricts destructive and admin-only actions", () => {
    expect(can("ADMIN", "property.delete")).toBe(true);
    expect(can("EDITOR", "property.delete")).toBe(false);
    expect(can("EDITOR", "property.publish")).toBe(true);
    expect(can("AGENT", "property.write")).toBe(false);
    expect(can("AGENT", "enquiry.readAll")).toBe(false);
    expect(can("AGENT", "enquiry.write")).toBe(true);
    expect(can("EDITOR", "user.manage")).toBe(false);
    expect(can(null, "dashboard.view")).toBe(false);
  });
});

describe("formatting", () => {
  it("formats prices and price on request", () => {
    expect(formatPrice({ price: "250000000", currency: "NGN" })).toMatch(/250,000,000/);
    expect(formatPrice({ price: null, currency: "NGN" })).toBe("Price on request");
    expect(formatPrice({ price: 10, currency: "NGN", priceOnRequest: true })).toBe("Price on request");
    expect(formatPrice({ price: 5_000_000, currency: "NGN", pricePeriod: "per annum" })).toMatch(/per annum$/);
  });

  it("survives an invalid currency code", () => {
    expect(formatPrice({ price: 1000, currency: "???" })).toBe("??? 1,000");
  });

  it("formats areas", () => {
    expect(formatArea("450.5", "SQM")).toBe("450.5 m²");
    expect(formatArea(null, "SQM")).toBeNull();
  });

  it("slugifies titles", () => {
    expect(slugify("  4-Bedroom Duplex & Pool — Ikoyi! ")).toBe("4-bedroom-duplex-and-pool-ikoyi");
    expect(slugify("Café Résidence")).toBe("cafe-residence");
  });

  it("builds WhatsApp links only for plausible numbers", () => {
    expect(whatsappLink("+234 801 234 5678", "Hi")).toBe("https://wa.me/2348012345678?text=Hi");
    expect(whatsappLink("123")).toBeNull();
    expect(whatsappLink(null)).toBeNull();
  });
});

describe("text parsing", () => {
  it("splits paragraphs", () => {
    expect(paragraphs("One\n\nTwo\n   \nThree")).toEqual(["One", "Two", "Three"]);
  });
  it("parses titled lines", () => {
    expect(titledLines("Integrity: We are honest\nLocal knowledge")).toEqual([
      { title: "Integrity", body: "We are honest" },
      { title: "Local knowledge", body: "" },
    ]);
  });
  it("parses headings and lists without HTML", () => {
    expect(textBlocks("## Title\n\n- a\n- b\n\n<script>x</script>")).toEqual([
      { kind: "h2", text: "Title" },
      { kind: "li", text: "a" },
      { kind: "li", text: "b" },
      { kind: "p", text: "<script>x</script>" },
    ]);
  });
});

describe("csv", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(csvCell('He said "hi", then\nleft')).toBe('"He said ""hi"", then\nleft"');
  });
  it("neutralises formula injection", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+1 800")).toBe("'+1 800");
  });
  it("builds rows", () => {
    expect(toCsv(["a", "b"], [[1, null]])).toBe("a,b\r\n1,\r\n");
  });
});

describe("file type detection", () => {
  const pad = (bytes: number[]) => new Uint8Array([...bytes, ...new Array(16).fill(0)]);
  it("detects allowed types from magic bytes", () => {
    expect(detectFileType(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectFileType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectFileType(pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
    expect(detectFileType(pad([0x25, 0x50, 0x44, 0x46]))).toBe("application/pdf");
  });
  it("rejects disguised files", () => {
    expect(detectFileType(pad([0x3c, 0x73, 0x76, 0x67]))).toBeNull(); // "<svg"
    expect(detectFileType(pad([0x4d, 0x5a]))).toBeNull(); // Windows executable
  });
});

describe("favourites cookie", () => {
  it("keeps only id-shaped, unique values", () => {
    expect(parseFavourites("clabc1234567890,clabc1234567890,<script>,x")).toEqual(["clabc1234567890"]);
    expect(parseFavourites(undefined)).toEqual([]);
  });
});

import { combinePhone, convertCurrency, indicativePrices, parseFxRates } from "@/lib/utils";

describe("indicative currency conversion", () => {
  const rates = parseFxRates("USD=1550\nGBP = 2,050\nbad line\nEUR:1700", "NGN");
  it("parses staff-entered rates relative to the base currency", () => {
    expect(rates).toEqual({ NGN: 1, USD: 1550, GBP: 2050, EUR: 1700 });
  });
  it("converts both ways via the base", () => {
    expect(convertCurrency(155_000_000, "NGN", "USD", rates)).toBe(100_000);
    expect(convertCurrency(100_000, "USD", "NGN", rates)).toBe(155_000_000);
    expect(convertCurrency(1, "JPY", "NGN", rates)).toBeNull();
  });
  it("lists equivalents in every other configured currency", () => {
    expect(indicativePrices(1550, "NGN", rates).map((x) => x.currency)).toEqual(["USD", "GBP", "EUR"]);
    expect(indicativePrices(null, "NGN", rates)).toEqual([]);
    expect(indicativePrices(100, "JPY", rates)).toEqual([]);
  });
});

describe("international phone numbers", () => {
  it("prefixes the dialling code and drops the trunk zero", () => {
    expect(combinePhone("+234", "0803 000 0000")).toBe("+234 803 000 0000");
    expect(combinePhone("+44", "07700 900123")).toBe("+44 7700 900123");
  });
  it("keeps numbers already in international format", () => {
    expect(combinePhone("+234", "+1 202 555 0100")).toBe("+1 202 555 0100");
  });
  it("ignores invalid codes and empty input", () => {
    expect(combinePhone("234; DROP", "0803")).toBe("0803");
    expect(combinePhone("+234", "  ")).toBeUndefined();
  });
});
