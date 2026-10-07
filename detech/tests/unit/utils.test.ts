import { describe, expect, it } from "vitest";

import { formatMoney, initials, percent, toDateKey } from "@/lib/utils";

describe("formatMoney", () => {
  it("formats with two decimals and a currency symbol", () => {
    expect(formatMoney(1200)).toMatch(/1,200/);
    expect(formatMoney(0)).toMatch(/0/);
  });

  it("treats null-ish input as zero", () => {
    expect(formatMoney(undefined as unknown as number)).toMatch(/0/);
  });
});

describe("toDateKey", () => {
  it("renders YYYY-MM-DD with zero padding", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateKey(new Date(2025, 11, 31))).toBe("2025-12-31");
  });
});

describe("percent", () => {
  it("computes a percentage rounded to one decimal place", () => {
    expect(percent(50, 200)).toBe(25);
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(2, 3)).toBe(66.7);
    expect(percent(7, 7)).toBe(100);
  });

  it("guards against divide-by-zero", () => {
    expect(percent(5, 0)).toBe(0);
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Ama Mensah")).toBe("AM");
    expect(initials("Kwame")).toBe("K");
    expect(initials("Nana Yaa Serwaa")).toBe("NY");
  });
});
