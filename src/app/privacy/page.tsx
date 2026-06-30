import Link from 'next/link';
import { HeaderNav } from "@/components/header-nav";
import { Eye, Shield, Lock, Globe } from 'lucide-react';

export const metadata = {
  title: "Privacy Policy",
  description: "Read the Privacy Policy for Highlanders Sports & Fitness to understand how we secure and manage your account information.",
};

export default function PrivacyPage() {
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
                    <linearGradient id="prv-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/><stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="prv-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/><stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="prv-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#prv-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#prv-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#prv-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#prv-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
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
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8a84b]">Security &amp; Trust</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              We respect your data privacy rights. Read how we collect, process, and protect your information.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-16 text-left">
          <div className="mx-auto w-full max-w-3xl px-6 space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            
            <div className="space-y-3">
              <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wide flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#c8a84b]" />
                <span>Information We Collect</span>
              </h3>
              <p>
                When you register, checkout, or browse the Highlanders Sports store, we collect details necessary to serve you. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Personal identifiers (your Name, Email address, and Billing/Shipping location details).</li>
                <li>Transaction records and session metadata.</li>
                <li>Device logs, browser types, cookies, and local storage variables (such as currency code selection).</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wide flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#c8a84b]" />
                <span>How We Secure Your Data</span>
              </h3>
              <p>
                We do not store your complete payment card details on our local database servers. All checkout card transactions are processed securely through **Stripe Payment Gateway** utilizing bank-grade secure encryption keys (SSL/TLS). We encrypt customer account passwords securely using `bcrypt` hashes before database storage.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wide flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#c8a84b]" />
                <span>Third Party Integrations</span>
              </h3>
              <p>
                To provide swift delivery and order updates, we share shipping details with logistics carriers. Email verification and order invoices are processed using private SMTP mailboxes. We do not sell or lease your demographic data to marketing agencies.
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
