import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export type CurrencySetting = {
  code: string;
  symbol: string;
  rate: number;
};

export type CurrencySettingsDoc = {
  _id?: unknown;
  key: 'currency';
  baseCurrency: string;
  currencies: CurrencySetting[];
  updatedAt: string;
};

const SETTINGS_KEY = 'currency' as const;

const DEFAULT_CURRENCIES: CurrencySetting[] = [
  { code: 'USD', symbol: '$', rate: 1.0 },
  { code: 'GBP', symbol: '£', rate: 0.78 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'LKR', symbol: 'Rs.', rate: 300.0 },
  { code: 'CAD', symbol: 'C$', rate: 1.36 },
  { code: 'AUD', symbol: 'A$', rate: 1.50 },
  { code: 'JPY', symbol: '¥', rate: 155.0 },
  { code: 'INR', symbol: '₹', rate: 83.5 },
  { code: 'CNY', symbol: '元', rate: 7.25 },
  { code: 'SGD', symbol: 'S$', rate: 1.35 },
  { code: 'AED', symbol: 'DH', rate: 3.67 },
  { code: 'NZD', symbol: 'NZ$', rate: 1.63 },
  { code: 'CHF', symbol: 'Fr', rate: 0.90 },
  { code: 'HKD', symbol: 'HK$', rate: 7.80 },
  { code: 'SEK', symbol: 'kr', rate: 10.50 },
  { code: 'ZAR', symbol: 'R', rate: 18.20 },
  { code: 'RUB', symbol: '₽', rate: 90.00 },
  { code: 'BRL', symbol: 'R$', rate: 5.30 },
  { code: 'MXN', symbol: 'Mex$', rate: 18.00 },
  { code: 'KRW', symbol: '₩', rate: 1380.00 },
];

export async function GET() {
  try {
    const settingsCol = await getCollection<CurrencySettingsDoc>('settings');
    const existing = await settingsCol.findOne({ key: SETTINGS_KEY } as any);

    return NextResponse.json({
      baseCurrency: existing?.baseCurrency ?? 'USD',
      currencies: existing?.currencies ?? DEFAULT_CURRENCIES,
      updatedAt: existing?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Error fetching currency settings', error);
    return NextResponse.json({ message: 'Error fetching currency settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      baseCurrency?: string;
      currencies?: CurrencySetting[];
    } | null;

    const baseCurrency = typeof body?.baseCurrency === 'string' ? body.baseCurrency.trim().toUpperCase() : 'USD';
    const currencies = Array.isArray(body?.currencies) ? body.currencies : DEFAULT_CURRENCIES;

    // Validate currencies
    if (currencies.length === 0) {
      return NextResponse.json({ message: 'At least one currency is required' }, { status: 400 });
    }

    // Ensure base currency has a rate of 1.0
    const updatedCurrencies = currencies.map((curr) => {
      const code = curr.code.trim().toUpperCase();
      const symbol = curr.symbol.trim();
      const rate = code === baseCurrency ? 1.0 : Number(curr.rate) || 1.0;
      return { code, symbol, rate };
    });

    // Ensure the base currency actually exists in the currencies list
    const hasBase = updatedCurrencies.some((curr) => curr.code === baseCurrency);
    if (!hasBase) {
      // Find default symbol for base currency or use default
      const defaultSym = DEFAULT_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || '$';
      updatedCurrencies.unshift({ code: baseCurrency, symbol: defaultSym, rate: 1.0 });
    }

    const settingsCol = await getCollection<CurrencySettingsDoc>('settings');
    const updatedAt = new Date().toISOString();

    await settingsCol.updateOne(
      { key: SETTINGS_KEY } as any,
      {
        $set: {
          key: SETTINGS_KEY,
          baseCurrency,
          currencies: updatedCurrencies,
          updatedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ baseCurrency, currencies: updatedCurrencies, updatedAt });
  } catch (error) {
    console.error('Error updating currency settings', error);
    return NextResponse.json({ message: 'Error updating currency settings' }, { status: 500 });
  }
}
