import Link from 'next/link';
import { HeaderNav } from "@/components/header-nav";
import { Truck, Package, Clock, ShieldAlert, Globe } from 'lucide-react';

export const metadata = {
  title: "Shipping & Delivery Info",
  description: "Learn about our shipping rates, delivery estimation times, international customs details, and quick dispatch guarantees.",
};

export default function ShippingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 shadow-sm transition-shadow duration-300 overflow-visible">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="cursor-pointer group flex items-center gap-2 shrink-0" aria-label="Highlanders Home">
              <div className="relative h-10 w-10 shrink-0">
                <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="shp-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/><stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="shp-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/><stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="shp-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#shp-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#shp-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#shp-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#shp-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-widest uppercase text-[#0f1a2e] group-hover:text-[#1e3a5f] transition-colors">Highlanders</span>
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{color:'#c8a84b'}}>Sports &amp; Fitness</span>
              </div>
            </Link>
            <HeaderNav />
          </div>
        </div>
      </header>
      <div className="h-16" aria-hidden="true" />

      <main className="flex-1">
        {/* Hero Title */}
        <section className="relative py-16 bg-[#0f1a2e] text-white">
          <div className="mx-auto w-full max-w-4xl px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8a84b]">Logistics Details</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Shipping &amp; Delivery</h1>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              We aim to deliver premium gear to athletes worldwide quickly, transparently, and securely.
            </p>
          </div>
        </section>

        {/* Content Details */}
        <section className="py-16 text-left">
          <div className="mx-auto w-full max-w-4xl px-6 space-y-12">
            
            {/* 24 hour dispatch */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c8a84b]/10 text-[#c8a84b]">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#0f1a2e] uppercase tracking-wide">24-Hour Dispatch Guarantee</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Because we manage a physical storefront and dedicated inventory warehouse, we prepare and dispatch all packages within 24 hours of successful payment authorization. Orders placed during weekend periods or public holidays are processed on the subsequent working business day.
                </p>
              </div>
            </div>

            {/* Estimates Table */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#c8a84b]" />
                <h3 className="text-lg font-bold text-[#0f1a2e] uppercase tracking-wider">Shipping Rates &amp; Timelines</h3>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[#0f1a2e] font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-4">Destination</th>
                      <th className="p-4">Estimated Transit</th>
                      <th className="p-4">Standard Cost</th>
                      <th className="p-4">Free Shipping Minimum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-500 font-medium">
                    <tr>
                      <td className="p-4 font-bold text-[#0f1a2e]">United Kingdom</td>
                      <td className="p-4">2 - 4 business days</td>
                      <td className="p-4">£4.99</td>
                      <td className="p-4 text-green-700 font-bold">Free over £50</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-[#0f1a2e]">European Union</td>
                      <td className="p-4">4 - 7 business days</td>
                      <td className="p-4">€8.99</td>
                      <td className="p-4 text-green-700 font-bold">Free over €75</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-[#0f1a2e]">United States / Canada</td>
                      <td className="p-4">5 - 9 business days</td>
                      <td className="p-4">$12.99</td>
                      <td className="p-4 text-green-700 font-bold">Free over $100</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-[#0f1a2e]">Asia / Sri Lanka</td>
                      <td className="p-4">7 - 15 business days</td>
                      <td className="p-4">LKR 4,500</td>
                      <td className="p-4 text-green-700 font-bold">Free over LKR 30,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom Fees */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex gap-4 items-start text-xs sm:text-sm text-amber-900">
              <ShieldAlert className="h-5 w-5 text-[#c8a84b] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold uppercase tracking-wider text-amber-800">Customs, Duties &amp; Import taxes</h4>
                <p className="leading-relaxed text-amber-700">
                  Please note that international shipments travelling outside the United Kingdom may be subject to custom clearance inspections, import tariffs, or value-added tax charges collected at the border of the target destination. These additional operational fees remain the sole responsibility of the customer.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
