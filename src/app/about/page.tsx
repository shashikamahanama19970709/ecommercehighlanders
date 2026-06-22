import Link from 'next/link';
import Image from 'next/image';
import { HeaderNav } from "@/components/header-nav";
import { connectToDatabase } from "@/lib/mongodb";
import AboutUsModule from "@/lib/models/AboutUsModule";
import type { AboutUsModule as AboutUsType } from "@/types/about-us";
import { ShieldCheck, Truck, Star, Award, MapPin, Mail, PhoneCall } from 'lucide-react';

async function getAboutUsData(): Promise<AboutUsType | null> {
  try {
    await connectToDatabase();
    const doc = await AboutUsModule.findOne({ moduleName: 'about-us' }).lean();
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc)) as AboutUsType;
  } catch (error) {
    console.error('Error fetching about us data for page:', error);
    return null;
  }
}

export const metadata = {
  title: "About Us",
  description: "Learn more about Highlanders Sports & Fitness — our heritage, our commitment to quality, and our mission to provide premium sports gear and fitness equipment.",
};

export default async function AboutPage() {
  const data = await getAboutUsData();

  // Fallback content in case MongoDB is empty or has issues
  const title = data?.title || "The Best Online Sports Equipment & Gear Store";
  const description = data?.description || 
    "We pride ourselves on providing fast, efficient and courteous service, always putting you, the customer first.\n\nWe hold a wide range of products in stock and aim to dispatch the vast majority of orders within 24 hours. We are authorised stockists for every item we sell, which means you get the full manufacturers warranty on all our products.";
  
  const image1 = data?.image1Url || "/images/about-placeholder-1.jpg";
  const image2 = data?.image2Url || "/images/about-placeholder-2.jpg";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 shadow-sm transition-shadow duration-300 overflow-visible">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Brand Logo */}
            <Link href="/" className="cursor-pointer group flex items-center gap-2 shrink-0" aria-label="Highlanders Sports & Fitness Home">
              <div className="relative h-10 w-10 shrink-0">
                <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="abt-hdr-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8edf5"/>
                      <stop offset="50%" stopColor="#c8d4e4"/>
                      <stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="abt-hdr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/>
                      <stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="abt-hdr-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/>
                      <stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#abt-hdr-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#abt-hdr-silver)" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#abt-hdr-gold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#abt-hdr-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-widest uppercase text-[#0f1a2e] group-hover:text-[#1e3a5f] transition-colors">
                  Highlanders
                </span>
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{color:'#c8a84b'}}>
                  Sports &amp; Fitness
                </span>
              </div>
            </Link>

            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Spacing for fixed header */}
      <div className="h-16" aria-hidden="true" />

      {/* Main Content */}
      <main className="flex-1">
        
        {/* Section 1: Hero Banner */}
        <section className="relative py-20 lg:py-28 overflow-hidden bg-[#0f1a2e] text-white">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#c8a84b]/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-[#1e3a5f]/40 blur-3xl pointer-events-none" />

          <div className="mx-auto w-full max-w-5xl px-6 relative z-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#c8a84b]">Our Story</span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
              Behind the Mountains
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Highlanders Sports & Fitness is dedicated to providing peak performance sports equipment, fitness gear, and support to athletes and trainers alike.
            </p>
          </div>
        </section>

        {/* Section 2: Detailed Story & Images */}
        <section className="py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_1.8fr] lg:items-center">
              
              {/* Images Column */}
              <div className="relative w-full pr-12 lg:pr-16">
                
                {/* Image 1 */}
                <div className="relative h-[380px] w-full overflow-hidden rounded-[2rem] shadow-2xl bg-slate-200">
                  {data?.image1Url ? (
                    <Image
                      src={data.image1Url}
                      alt="Highlanders training equipment"
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 34vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 font-bold bg-slate-100">
                      Highlanders Gear
                    </div>
                  )}
                </div>

                {/* Overlapping Image 2 */}
                <div className="absolute -bottom-6 right-0 w-[55%] z-20">
                  <div className="relative h-[200px] overflow-hidden rounded-[1.5rem] bg-slate-300 shadow-2xl border-4 border-white">
                    {data?.image2Url ? (
                      <Image
                        src={data.image2Url}
                        alt="Highlanders sports performance"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 24vw, 70vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 font-bold bg-slate-200">
                        Peak Performance
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Details Column */}
              <div className="flex flex-col gap-6">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#c8a84b]">About Highlanders</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f1a2e] tracking-tight leading-tight">
                  {title}
                </h2>
                <div className="space-y-6 text-slate-600 text-base leading-relaxed font-medium whitespace-pre-line">
                  {description}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 3: Value Highlights Grid */}
        <section className="py-20 bg-gradient-to-b from-white to-slate-100/60 border-t border-b border-slate-100">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8a84b]">Why Choose Us</span>
              <h2 className="mt-3 text-3xl font-extrabold text-[#0f1a2e] tracking-tight">Our Core Promises</h2>
              <p className="mt-4 text-sm text-slate-500 font-medium">We represent a new standard in sporting excellence and customer reliability.</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              
              {/* Card 1 */}
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8a84b]/10 text-[#c8a84b] mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f1a2e] tracking-tight">Authorized Stockist</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                  We are authorized dealers for premium sports brands. Buy with absolute peace of mind knowing all items carry a full manufacturer's warranty.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8a84b]/10 text-[#c8a84b] mb-6">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f1a2e] tracking-tight">Fast 24-Hour Dispatch</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                  We maintain a physical stock of our items, enabling us to pick, package, and dispatch orders within 24 hours of confirmation.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md sm:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8a84b]/10 text-[#c8a84b] mb-6">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f1a2e] tracking-tight">Customer First Service</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                  Courteous, swift, and effective customer support is part of our DNA. If any issues arise, we resolve them transparently and quickly.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 4: Brand CTA Section */}
        <section className="py-24 relative overflow-hidden bg-[#0f1a2e] text-white text-center">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#c8a84b]/10 blur-3xl pointer-events-none" />
          
          <div className="mx-auto w-full max-w-4xl px-6 relative z-10 flex flex-col items-center">
            <Award className="h-12 w-12 text-[#c8a84b] mb-6" />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to Train Like a Champion?</h2>
            <p className="mt-4 text-slate-300 max-w-lg mx-auto text-sm sm:text-base font-medium">
              Explore our dynamic collection of premium sports goods, tailored fit wear, and championship grade gear.
            </p>
            <div className="mt-8">
              <Link 
                href="/#catalog"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#c8a84b] hover:bg-[#b0913e] px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <span>Shop the Catalog</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}
