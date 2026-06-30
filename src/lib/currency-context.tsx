'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type CurrencySetting = {
  code: string;
  symbol: string;
  rate: number;
};

type CurrencyContextType = {
  baseCurrency: string;
  currencies: CurrencySetting[];
  selectedCurrency: CurrencySetting;
  changeCurrency: (code: string) => void;
  formatPrice: (amount: number) => string;
  convertPrice: (amount: number) => number;
  loading: boolean;
};

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

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState<CurrencySetting[]>(DEFAULT_CURRENCIES);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencySetting>(DEFAULT_CURRENCIES[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrencySettings() {
      try {
        const res = await fetch('/api/settings/currency', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load currency settings');
        const data = await res.json();
        
        const base = data.baseCurrency || 'USD';
        const list = Array.isArray(data.currencies) ? data.currencies : DEFAULT_CURRENCIES;
        
        setBaseCurrency(base);
        setCurrencies(list);

        // Determine initially selected currency (from localStorage or match base)
        const savedCode = localStorage.getItem('selected_currency');
        const found = list.find((c: CurrencySetting) => c.code === savedCode);
        const defaultSelected = found || list.find((c: CurrencySetting) => c.code === base) || list[0];
        
        setSelectedCurrency(defaultSelected);
      } catch (err) {
        console.error('Error loading currency context settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCurrencySettings();
  }, []);

  const [sessionSynced, setSessionSynced] = useState(false);
  const userId = (session?.user as any)?.id || null;
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    if (userId !== lastUserId) {
      setLastUserId(userId);
      setSessionSynced(false);
    }
  }, [userId, lastUserId]);

  // Update selected currency when user logs in and has a preferred currency saved
  useEffect(() => {
    if (session?.user && !sessionSynced && currencies.length > 0) {
      const userPreferredCode = (session.user as any).baseCurrency;
      if (userPreferredCode) {
        const found = currencies.find((c) => c.code === userPreferredCode.toUpperCase());
        if (found) {
          setSelectedCurrency(found);
          localStorage.setItem('selected_currency', found.code);
        }
      }
      setSessionSynced(true);
    }
  }, [session, currencies, sessionSynced]);

  const changeCurrency = async (code: string) => {
    const target = currencies.find((c) => c.code === code);
    if (target) {
      setSelectedCurrency(target);
      localStorage.setItem('selected_currency', code);
      if (session?.user) {
        try {
          await fetch('/api/user/currency', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency: code }),
          });
        } catch (err) {
          console.error('Failed to sync currency preference to DB:', err);
        }
      }
    }
  };

  const convertPrice = (amount: number): number => {
    if (loading) return amount;
    const rate = selectedCurrency ? selectedCurrency.rate : 1.0;
    return amount * rate;
  };

  const formatPrice = (amount: number): string => {
    const rate = selectedCurrency ? selectedCurrency.rate : 1.0;
    const symbol = selectedCurrency ? selectedCurrency.symbol : '$';
    const converted = amount * rate;
    const space = symbol.length > 1 ? ' ' : '';
    return `${symbol}${space}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        baseCurrency,
        currencies,
        selectedCurrency,
        changeCurrency,
        formatPrice,
        convertPrice,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
