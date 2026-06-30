import Link from 'next/link';
import { HeaderNav } from "@/components/header-nav";
import { HelpCircle, Mail, PhoneCall, MapPin, MessageSquare, ShieldQuestion, Clock } from 'lucide-react';

export const metadata = {
  title: "Help Center",
  description: "Get assistance with your orders, shipping, payment methods, returns, and sport gear specifications.",
};

export default function HelpCenterPage() {
  const faqs = [
    {
      q: "How can I track my order status?",
      a: "If you checked out while logged into your account, simply navigate to your profile avatar and click 'My Orders'. If you checked out as a guest, click 'Track My Order' in the footer, go to the 'Guest Lookup' tab, and enter your email address and Stripe Session ID from your receipt."
    },
    {
      q: "What is your shipping time and dispatch process?",
      a: "We maintain a full physical inventory, allowing us to pack and dispatch orders within 24 hours. Transit times range from 7 to 15 business days depending on your location."
    },
    {
      q: "What payment currencies do you support?",
      a: "We support multiple checkout currencies including USD ($), EUR (€), GBP (£), and LKR (Rs.). You can choose your preferred base currency using the currency selector dropdown located in the header navigation bar."
    },
    {
      q: "What is your returns policy?",
      a: "We offer a 30-day window for returns and exchanges. Items must be unused, in their original brand packaging, and retain all security tags."
    },
    {
      q: "Are the products covered by warranties?",
      a: "Yes. Highlanders Sports & Fitness is an authorized stockist for every single brand we list. All gear is protected by standard manufacturer warranties."
    }
  ];

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
                    <linearGradient id="hlp-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/><stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="hlp-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/><stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="hlp-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#hlp-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#hlp-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#hlp-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#hlp-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
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
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8a84b]">Support Hub</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Help Center</h1>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Find answers to frequently asked questions or contact our customer support team directly.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-3">
              
              {/* FAQs column */}
              <div className="lg:col-span-2 space-y-6 text-left">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldQuestion className="h-5 w-5 text-[#c8a84b]" />
                  <h2 className="text-xl font-bold text-[#0f1a2e] uppercase tracking-wide">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-slate-100/40">
                      <h3 className="text-sm font-bold text-[#0f1a2e] flex items-start gap-2.5">
                        <span className="text-[#c8a84b] mt-0.5">Q:</span>
                        <span>{faq.q}</span>
                      </h3>
                      <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed pl-6">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Support details card */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm shadow-slate-100/40 space-y-6 text-left">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-md font-bold text-[#0f1a2e] uppercase tracking-wider">Contact Support</h3>
                    <p className="text-xs text-slate-400 mt-1">Available Monday to Friday, 9:00 AM - 5:00 PM GMT.</p>
                  </div>

                  <ul className="space-y-4 text-xs">
                    <li className="flex items-start gap-3">
                      <Mail className="h-4 w-4 shrink-0 text-[#c8a84b]" />
                      <div>
                        <span className="block font-bold text-[#0f1a2e]">Email support</span>
                        <a href="mailto:support@highlandersfitness.store" className="text-slate-500 hover:text-[#c8a84b]">support@highlandersfitness.store</a>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <PhoneCall className="h-4 w-4 shrink-0 text-[#c8a84b]" />
                      <div>
                        <span className="block font-bold text-[#0f1a2e]">Phone Line</span>
                        <a href="tel:+447491807132" className="text-slate-500 hover:text-[#c8a84b]">+44 7491807132</a>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 shrink-0 text-[#c8a84b]" />
                      <div>
                        <span className="block font-bold text-[#0f1a2e]">Office Address</span>
                        <span className="text-slate-500 leading-normal">
                          71-75 Shelton Street,<br />London, WC2H 9JQ
                        </span>
                      </div>
                    </li>
                  </ul>

                  <div className="border-t border-slate-100 pt-6">
                    <Link
                      href="/order-lookup"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f1a2e] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1e3a5f] transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Track Existing Order
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
