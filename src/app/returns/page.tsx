import Link from 'next/link';
import { HeaderNav } from "@/components/header-nav";
import { History, ShieldCheck, HelpCircle, FileText, CheckCircle } from 'lucide-react';

export const metadata = {
  title: "Returns & Exchanges Policy",
  description: "Review our 30-day return policies, refunds, exchanges processing times, and terms for returned sports gear.",
};

export default function ReturnsPage() {
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
                    <linearGradient id="ret-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/><stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="ret-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/><stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="ret-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#ret-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#ret-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#ret-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#ret-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
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
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8a84b]">Customer Satisfaction</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Returns &amp; Exchanges</h1>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              We want you to love your training equipment. Read our easy 30-day returns and replacements terms below.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-16 text-left">
          <div className="mx-auto w-full max-w-3xl px-6 space-y-12">
            
            {/* 30 day policy */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#0f1a2e] uppercase tracking-wide">30-Day Return Window</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                You may request a return or size exchange for items purchased online within **30 days** of delivery. To verify your order's delivery date or print out purchase details, please visit your account dashboard under <Link href="/order-lookup" className="font-bold text-[#1e3a5f] hover:underline">My Orders</Link>.
              </p>
            </div>

            {/* Conditions Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-4">
              <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span>Eligible Conditions for Return</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-500 font-medium">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c8a84b]" />
                  <span>Items must be completely unused, unwashed, and undamaged.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c8a84b]" />
                  <span>Products must contain all original tags, boxes, and protective wrapping intact.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c8a84b]" />
                  <span>For safety, custom-molded items (mouthguards) or personal wear (compression socks) are ineligible for returns.</span>
                </li>
              </ul>
            </div>

            {/* Steps process */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#0f1a2e] uppercase tracking-wider">How to initiate a return</h3>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                  <span className="text-xs font-bold text-[#c8a84b] uppercase tracking-wider block mb-2">Step 01</span>
                  <h4 className="text-sm font-bold text-[#0f1a2e] mb-1">Email Request</h4>
                  <p className="text-[11px] leading-relaxed text-slate-500">Contact us at <a href="mailto:support@highlandersfitness.store" className="font-semibold text-[#1e3a5f] hover:underline">support@</a> with your Order ID.</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                  <span className="text-xs font-bold text-[#c8a84b] uppercase tracking-wider block mb-2">Step 02</span>
                  <h4 className="text-sm font-bold text-[#0f1a2e] mb-1">Package Gear</h4>
                  <p className="text-[11px] leading-relaxed text-slate-500">Pack items securely in their original boxes. Label the package clearly.</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                  <span className="text-xs font-bold text-[#c8a84b] uppercase tracking-wider block mb-2">Step 03</span>
                  <h4 className="text-sm font-bold text-[#0f1a2e] mb-1">Get Refunded</h4>
                  <p className="text-[11px] leading-relaxed text-slate-500">Upon reception, our team will verify the gear and process your refund within 5 days.</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
