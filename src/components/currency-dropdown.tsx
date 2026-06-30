'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrency } from '@/lib/currency-context';
import { Globe, Search, Check, ChevronDown } from 'lucide-react';

interface CurrencyDropdownProps {
  align?: 'left' | 'right';
  className?: string;
  isMobile?: boolean;
}

export function CurrencyDropdown({ align = 'right', className = '', isMobile = false }: CurrencyDropdownProps) {
  const { currencies, selectedCurrency, changeCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredCurrencies = currencies.filter((c) => {
    const codeMatch = c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const symbolMatch = c.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const names: Record<string, string> = {
      USD: 'US Dollar',
      GBP: 'British Pound',
      EUR: 'Euro',
      LKR: 'Sri Lankan Rupee',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      JPY: 'Japanese Yen',
      INR: 'Indian Rupee',
      CNY: 'Chinese Yuan',
      SGD: 'Singapore Dollar',
      AED: 'UAE Dirham',
      NZD: 'New Zealand Dollar',
      CHF: 'Swiss Franc',
      HKD: 'Hong Kong Dollar',
      SEK: 'Swedish Krona',
      ZAR: 'South African Rand',
      RUB: 'Russian Ruble',
      BRL: 'Brazilian Real',
      MXN: 'Mexican Peso',
      KRW: 'South Korean Won',
    };
    const nameMatch = (names[c.code] || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return codeMatch || symbolMatch || nameMatch;
  });

  const getCurrencyName = (code: string) => {
    const names: Record<string, string> = {
      USD: 'US Dollar',
      GBP: 'British Pound',
      EUR: 'Euro',
      LKR: 'Sri Lankan Rupee',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      JPY: 'Japanese Yen',
      INR: 'Indian Rupee',
      CNY: 'Chinese Yuan',
      SGD: 'Singapore Dollar',
      AED: 'UAE Dirham',
      NZD: 'New Zealand Dollar',
      CHF: 'Swiss Franc',
      HKD: 'Hong Kong Dollar',
      SEK: 'Swedish Krona',
      ZAR: 'South African Rand',
      RUB: 'Russian Ruble',
      BRL: 'Brazilian Real',
      MXN: 'Mexican Peso',
      KRW: 'South Korean Won',
    };
    return names[code] || 'Currency';
  };

  if (isMobile) {
    return (
      <div ref={dropdownRef} className={`w-full ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-[#0f1a2e] hover:bg-[#f0f4f8] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#0f1a2e]/60" />
            <span>Currency: <b>{selectedCurrency.code} ({selectedCurrency.symbol})</b></span>
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="mt-2 rounded-xl border border-[#dde4ee] bg-white p-3 shadow-md space-y-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#dde4ee] bg-[#f8fafc] pl-9 pr-3 text-xs font-semibold outline-none focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/10"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      changeCurrency(c.code);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors rounded-lg ${
                      selectedCurrency.code === c.code
                        ? 'bg-[#1e3a5f]/05 font-bold text-[#1e3a5f]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="font-semibold text-slate-900">{c.code} ({c.symbol})</span>
                      <span className="text-[10px] text-slate-400">{getCurrencyName(c.code)}</span>
                    </span>
                    {selectedCurrency.code === c.code && <Check className="h-3.5 w-3.5 text-[#1e3a5f]" />}
                  </button>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">No currencies found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex items-center gap-1.5 rounded-full border border-[#dde4ee] px-3.5 py-2 text-xs font-bold
          bg-white text-[#0f1a2e] shadow-sm hover:border-[#1e3a5f] hover:bg-slate-50
          transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/20
          ${isOpen ? 'border-[#1e3a5f] ring-2 ring-[#1e3a5f]/10 bg-slate-50' : ''}
        `}
      >
        <Globe className="h-3.5 w-3.5 text-[#0f1a2e]/60" />
        <span>{selectedCurrency.code} ({selectedCurrency.symbol})</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1e3a5f]' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 w-64 rounded-2xl border border-[#dde4ee] bg-white p-3 shadow-xl backdrop-blur-md
            animate-fade-in focus:outline-none
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          style={{ animationDuration: '0.15s' }}
        >
          {/* Search Input */}
          <div className="relative flex items-center mb-2 px-1">
            <Search className="absolute left-3.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#dde4ee] bg-[#f8fafc] pl-9 pr-3 text-xs font-semibold text-[#0f1a2e] outline-none transition-all focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/10"
              autoFocus
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 my-1.5" />

          {/* List Options */}
          <div className="max-h-56 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    changeCurrency(c.code);
                    setIsOpen(false);
                  }}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs
                    transition-all duration-150 group
                    ${selectedCurrency.code === c.code
                      ? 'bg-[#1e3a5f]/05 font-bold text-[#1e3a5f]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#0f1a2e]'
                    }
                  `}
                >
                  <span className="flex flex-col">
                    <span className="font-semibold text-slate-900 group-hover:text-black">{c.code} ({c.symbol})</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-500 font-medium">{getCurrencyName(c.code)}</span>
                  </span>
                  {selectedCurrency.code === c.code && <Check className="h-3.5 w-3.5 text-[#1e3a5f]" />}
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-xs font-medium text-slate-400">No results found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
