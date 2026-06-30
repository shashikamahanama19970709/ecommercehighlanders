import Link from 'next/link';
import { HeaderNav } from "@/components/header-nav";
import { FileText, ShieldAlert, Award } from 'lucide-react';

export const metadata = {
  title: "Terms & Conditions",
  description: "Read the terms of service, billing policies, dynamic currency rate agreements, and user rules for Highlanders Sports & Fitness.",
};

export default function TermsPage() {
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
                    <linearGradient id="trms-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/><stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="trms-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/><stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="trms-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#trms-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#trms-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#trms-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#trms-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
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
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8a84b]">User Agreement</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Terms &amp; Conditions</h1>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Read the legal rules and purchasing policies of Highlanders Sports &amp; Fitness before ordering.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-16 text-left">
          <div className="mx-auto w-full max-w-3xl px-6 space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            
            <div className="space-y-3">
              <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#c8a84b]" />
                <span>01. General Overview</span>
              </h3>
              <p>
                By accessing this ecommerce website, registering a customer account, or completing orders, you agree to follow these Terms and Conditions. Highlanders Sports & Fitness reserves the right to modify pricing, inventory levels, and terms at any time.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wide flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#c8a84b]" />
                <span>02. Account Registration &amp; Safety</span>
              </h3>
              <p>
                When creating an account, you must provide valid email addresses for verification. You remain responsible for keeping your login credentials confidential. We reserve the right to suspend accounts engaged in fraudulent order behavior.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wide flex items-center gap-2">
                <Award className="h-4 w-4 text-[#c8a84b]" />
                <span>03. Pricing &amp; Currency Rates</span>
              </h3>
              <p>
                Product pricing defaults to USD ($). Conversions to other currencies (EUR, GBP, LKR) are computed dynamically using base currency rates defined by the store administrator. All payments are verified securely and settled through Stripe.
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
