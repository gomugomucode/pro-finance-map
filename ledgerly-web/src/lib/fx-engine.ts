/**
 * FX Engine & Multi-Currency Normalization System
 * Provides deterministic precision conversions, exchange rate lookups,
 * and multi-currency aggregate net worth calculations.
 */

export interface ExchangeRateTable {
  [currencyCode: string]: number; // Rate relative to 1 USD (USD = 1.0)
}

export const DEFAULT_USD_EXCHANGE_RATES: ExchangeRateTable = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  NPR: 133.6,
  JPY: 155.0,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.9,
  SGD: 1.35,
  AED: 3.67,
  CNY: 7.25,
  NZD: 1.64,
  KRW: 1380.0,
  BRL: 5.45,
  MXN: 18.2,
  ZAR: 18.1,
  SEK: 10.5,
  NOK: 10.6,
  DKK: 6.85,
  THB: 36.5,
  MYR: 4.71,
  IDR: 16250.0,
  PHP: 58.5,
  PKR: 278.5,
  BDT: 117.5,
  VND: 25450.0,
  TRY: 32.8,
  RUB: 88.0,
  PLN: 3.95,
  CZK: 23.1,
  HUF: 365.0,
  ILS: 3.72,
};

export const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "CLP", "HUF"]);

export function getCurrencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

/**
 * Calculates direct or triangular FX rate from fromCurrency to toCurrency.
 * E.g., rate(EUR -> INR) = (USD->INR) / (USD->EUR)
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRateTable = DEFAULT_USD_EXCHANGE_RATES,
): number {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return 1.0;

  const rateFromUSD = rates[from] ?? (from === "USD" ? 1.0 : undefined);
  const rateToUSD = rates[to] ?? (to === "USD" ? 1.0 : undefined);

  if (!rateFromUSD || !rateToUSD || rateFromUSD <= 0) {
    // Fallback safe 1.0 if unknown
    return 1.0;
  }

  return rateToUSD / rateFromUSD;
}

/**
 * Converts minor units between currencies taking into account differing decimal precision.
 */
export function convertCurrency(
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRateTable = DEFAULT_USD_EXCHANGE_RATES,
): number {
  if (amountMinor === 0) return 0;
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amountMinor;

  const fromDecimals = getCurrencyDecimals(from);
  const toDecimals = getCurrencyDecimals(to);

  // Convert minor to major unit
  const majorAmount = amountMinor / Math.pow(10, fromDecimals);

  // Apply FX rate
  const fxRate = getExchangeRate(from, to, rates);
  const convertedMajor = majorAmount * fxRate;

  // Convert back to target minor units and round
  return Math.round(convertedMajor * Math.pow(10, toDecimals));
}

export interface BalanceEntry {
  current_balance_minor?: number | null;
  currency?: string | null;
}

export interface AssetEntry {
  value_minor?: number | null;
  currency?: string | null;
}

export interface LiabilityEntry {
  current_balance_minor?: number | null;
  currency?: string | null;
}

export interface LoanEntry {
  principal_minor?: number | null;
  paid_minor?: number | null;
  currency?: string | null;
  direction?: string | null; // "lent" | "borrowed"
  is_settled?: boolean | null;
}

/**
 * Computes consolidated multi-currency Net Worth converted into user's base currency.
 * Net Worth = Liquid Accounts + Assets - Liabilities + (Lent Loans - Borrowed Loans)
 */
export function calculateConsolidatedNetWorth(params: {
  baseCurrency: string;
  accounts?: BalanceEntry[];
  assets?: AssetEntry[];
  liabilities?: LiabilityEntry[];
  loans?: LoanEntry[];
  rates?: ExchangeRateTable;
}): {
  netWorthMinor: number;
  totalLiquidMinor: number;
  totalAssetsMinor: number;
  totalLiabilitiesMinor: number;
  totalLoansMinor: number;
} {
  const {
    baseCurrency = "USD",
    accounts = [],
    assets = [],
    liabilities = [],
    loans = [],
    rates = DEFAULT_USD_EXCHANGE_RATES,
  } = params;

  // 1. Liquid Accounts
  const totalLiquidMinor = accounts.reduce((sum, acc) => {
    const minor = Number(acc.current_balance_minor || 0);
    const curr = acc.currency || "USD";
    return sum + convertCurrency(minor, curr, baseCurrency, rates);
  }, 0);

  // 2. Fixed & Investment Assets
  const totalAssetsMinor = assets.reduce((sum, asset) => {
    const minor = Number(asset.value_minor || 0);
    const curr = asset.currency || "USD";
    return sum + convertCurrency(minor, curr, baseCurrency, rates);
  }, 0);

  // 3. Debts & Liabilities
  const totalLiabilitiesMinor = liabilities.reduce((sum, liab) => {
    const minor = Number(liab.current_balance_minor || 0);
    const curr = liab.currency || "USD";
    return sum + convertCurrency(minor, curr, baseCurrency, rates);
  }, 0);

  // 4. Peer Loans & Receivables
  const totalLoansMinor = loans.reduce((sum, loan) => {
    if (loan.is_settled) return sum;
    const remainingMinor = Math.max(
      0,
      Number(loan.principal_minor || 0) - Number(loan.paid_minor || 0),
    );
    const curr = loan.currency || "USD";
    const converted = convertCurrency(remainingMinor, curr, baseCurrency, rates);

    if (loan.direction === "lent") {
      // Money owed to the user (asset / receivable)
      return sum + converted;
    } else {
      // Money the user owes to others (liability / payable)
      return sum - converted;
    }
  }, 0);

  const netWorthMinor =
    totalLiquidMinor + totalAssetsMinor - totalLiabilitiesMinor + totalLoansMinor;

  return {
    netWorthMinor,
    totalLiquidMinor,
    totalAssetsMinor,
    totalLiabilitiesMinor,
    totalLoansMinor,
  };
}
