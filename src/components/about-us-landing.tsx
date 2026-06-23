import Image from 'next/image';
import Link from 'next/link';
import type { AboutUsModule } from '@/types/about-us';

type Props = {
  moduleDoc: AboutUsModule | null;
};

export function AboutUsLandingSection({ moduleDoc }: Props) {
  if (!moduleDoc) return null;
  const title = moduleDoc.title?.trim() || '';
  const description = moduleDoc.description?.trim() || '';
  const image1 = moduleDoc.image1Url || "/images/about-placeholder-1.png";
  const image2 = moduleDoc.image2Url || "/images/about-placeholder-2.png";

  if (!title && !description && !image1 && !image2) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="relative grid gap-12 lg:grid-cols-[1.1fr_1.9fr] lg:items-center">
        
        {/* Left Side: Overlapping Images + Brand Button */}
        <div className="flex flex-col gap-8">
          <div className="relative w-full pr-12 lg:pr-16">
            
            {/* Big Main Image */}
            <div className="relative h-[400px] w-full overflow-hidden rounded-[2rem] shadow-2xl bg-muted group">
              {image1 ? (
                <Image
                  src={image1}
                  alt="About us main image"
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
              )}
              {/* Subtle gold overlay border */}
              <div className="absolute inset-0 rounded-[2rem] border border-white/10 pointer-events-none" />
            </div>

            {/* Small Overlapping Image */}
            <div className="absolute -bottom-8 right-0 w-[55%] z-20 transition-transform duration-500 hover:scale-105">
              <div className="relative h-[220px] overflow-hidden rounded-[1.5rem] bg-muted shadow-2xl border-4 border-white group">
                {image2 ? (
                  <Image
                    src={image2}
                    alt="About us secondary image"
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(min-width: 1024px) 24vw, 70vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
                )}
              </div>
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="mt-4 self-start">
            <Link
              href="/about"
              className="group inline-flex items-center gap-3.5 rounded-full bg-[#0f1a2e] px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#0f1a2e]/10 transition-all duration-300 hover:bg-[#c8a84b] hover:shadow-xl hover:shadow-[#c8a84b]/20 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#c8a84b] focus:ring-offset-2"
            >
              <span>DISCOVER MORE</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-300 group-hover:translate-x-1">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Right Side: Details Card */}
        <div className="relative z-10 bg-gradient-to-br from-white to-[#f8fafc] border border-slate-100 p-10 lg:p-14 rounded-[2.5rem] shadow-xl shadow-slate-100/50 overflow-hidden group">
          {/* Subtle brand glow behind text */}
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#c8a84b]/05 blur-3xl pointer-events-none group-hover:bg-[#c8a84b]/10 transition-all duration-700" />
          
          <div className="flex flex-col gap-5">
            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#c8a84b]">
                About Us
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0f1a2e] leading-tight">
                {title}
              </h2>
            </div>

            {/* Content Body */}
            <div className="mt-4 space-y-6 text-sm sm:text-base leading-relaxed text-[#0f1a2e]/80 whitespace-pre-line font-medium">
              {description}
            </div>

            {/* Value Highlights */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8a84b]/10 text-[#c8a84b]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-[#0f1a2e] uppercase tracking-wider">Authorized Stockist</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8a84b]/10 text-[#c8a84b]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-[#0f1a2e] uppercase tracking-wider">24h Quick Dispatch</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
