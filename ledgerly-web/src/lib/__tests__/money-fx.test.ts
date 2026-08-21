import { describe, it, expect } from "vitest";
import { toMinor, fromMinor, formatMoney } from "../money";
import {
  getExchangeRate,
  convertCurrency,
  calculateConsolidatedNetWorth,
  getCurrencyDecimals,
  DEFAULT_USD_EXCHANGE_RATES,
} from "../fx-engine";

describe("Money Utilities (Precision Arithmetic)", () => {
  it("converts major units to minor units with standard 2 decimals", () => {
    expect(toMinor(10.5)).toBe(1050);
    expect(toMinor(0.01)).toBe(1);
    expect(toMinor(100)).toBe(10000);
    expect(toMinor(0)).toBe(0);
    expect(toMinor(-25.75)).toBe(-2575);
  });

  it("handles zero-decimal currencies (JPY) appropriately", () => {
    expect(getCurrencyDecimals("JPY")).toBe(0);
    expect(toMinor(1500, 0)).toBe(1500);
    expect(fromMinor(1500, 0)).toBe(1500);
  });

  it("converts minor units back to major units", () => {
    expect(fromMinor(1050)).toBe(10.5);
    expect(fromMinor(1)).toBe(0.01);
    expect(fromMinor(10000)).toBe(100);
    expect(fromMinor(-2575)).toBe(-25.75);
  });

  it("formats money correctly with symbol and decimals", () => {
    expect(formatMoney(1050, "USD")).toContain("10.50");
    expect(formatMoney(1050, "USD", 2, { signed: true })).toContain("+");
    expect(formatMoney(-1050, "USD", 2, { signed: true })).toContain("-");
    expect(formatMoney(0, "USD")).toContain("0.00");
  });
});

describe("FX Engine & Currency Conversion", () => {
  it("returns 1.0 for identical currencies", () => {
    expect(getExchangeRate("USD", "USD")).toBe(1.0);
    expect(getExchangeRate("EUR", "EUR")).toBe(1.0);
    expect(convertCurrency(5000, "USD", "USD")).toBe(5000);
  });

  it("converts direct USD rates properly", () => {
    // 100 USD (10000 minor) to EUR (0.92 rate) -> 92 EUR (9200 minor)
    const converted = convertCurrency(10000, "USD", "EUR", { USD: 1.0, EUR: 0.92 });
    expect(converted).toBe(9200);
  });

  it("performs triangular conversion between non-USD currencies (EUR -> NPR)", () => {
    // EUR=0.92, NPR=133.6 => 1 EUR = 133.6 / 0.92 = 145.21739... NPR
    // 100 EUR (10000 minor) => 14,521.74 NPR (1452174 minor)
    const converted = convertCurrency(10000, "EUR", "NPR", {
      USD: 1.0,
      EUR: 0.92,
      NPR: 133.6,
    });
    expect(converted).toBe(1452174);
  });

  it("converts across differing decimal currencies (USD to JPY)", () => {
    // 10 USD (1000 minor) to JPY (rate: 155.0, 0 decimals) -> 1550 JPY (1550 minor)
    const converted = convertCurrency(1000, "USD", "JPY", { USD: 1.0, JPY: 155.0 });
    expect(converted).toBe(1550);
  });
});

describe("Consolidated Net Worth Multi-Currency Calculation", () => {
  it("calculates multi-currency net worth consolidated in base currency (USD)", () => {
    const result = calculateConsolidatedNetWorth({
      baseCurrency: "USD",
      accounts: [
        { current_balance_minor: 100000, currency: "USD" }, // $1,000
        { current_balance_minor: 92000, currency: "EUR" }, // €920 = $1,000
      ],
      assets: [
        { value_minor: 500000, currency: "USD" }, // $5,000
      ],
      liabilities: [
        { current_balance_minor: 100000, currency: "USD" }, // $1,000
      ],
      loans: [
        { principal_minor: 50000, paid_minor: 0, currency: "USD", direction: "lent" }, // +$500
        { principal_minor: 30000, paid_minor: 10000, currency: "USD", direction: "borrowed" }, // -$200
      ],
      rates: { USD: 1.0, EUR: 0.92 },
    });

    // Liquid: $1000 + $1000 = $2000 (200000 minor)
    // Assets: $5000 (500000 minor)
    // Liabilities: $1000 (100000 minor)
    // Loans: +$500 - $200 = +$300 (30000 minor)
    // Net worth = 2000 + 5000 - 1000 + 300 = $6,300 (630000 minor)
    expect(result.totalLiquidMinor).toBe(200000);
    expect(result.totalAssetsMinor).toBe(500000);
    expect(result.totalLiabilitiesMinor).toBe(100000);
    expect(result.totalLoansMinor).toBe(30000);
    expect(result.netWorthMinor).toBe(630000);
  });
});
