export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
}

export const ISO_CURRENCIES: CurrencyInfo[] = [
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs.', country: 'Nepal', flag: '🇳🇵' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India', flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'Eurozone', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore', flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', country: 'Hong Kong', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', country: 'New Zealand', flag: '🇳🇿' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea', flag: '🇰🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', country: 'Mexico', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil', flag: '🇧🇷' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa', flag: '🇿🇦' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: 'Sweden', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: 'Norway', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', country: 'Denmark', flag: '🇩🇰' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand', flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'Philippines', flag: '🇵🇭' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', country: 'Pakistan', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'Bangladesh', flag: '🇧🇩' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', country: 'Turkey', flag: '🇹🇷' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', country: 'Egypt', flag: '🇪🇬' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya', flag: '🇰🇪' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia', flag: '🇷🇺' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', country: 'Poland', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', country: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', country: 'Hungary', flag: '🇭🇺' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', country: 'Israel', flag: '🇮🇱' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', country: 'Chile', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COL$', country: 'Colombia', flag: '🇨🇴' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', country: 'Peru', flag: '🇵🇪' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS$', country: 'Argentina', flag: '🇦🇷' },
];

export function getCurrencyInfo(code: string): CurrencyInfo {
  const match = ISO_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (match) return match;
  return { code: code.toUpperCase(), name: `${code.toUpperCase()} Currency`, symbol: code.toUpperCase(), country: 'Global', flag: '🌐' };
}

export function searchCurrencies(query: string): CurrencyInfo[] {
  if (!query.trim()) return ISO_CURRENCIES;
  const q = query.toLowerCase().trim();

  return ISO_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
  );
}
