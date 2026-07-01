'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import type { LandingHeroBannerModule } from '@/types/landing-hero-banner';

type HeroPanel = {
  key: string;
  sportId: string;
  title: string;
  videoSrc: string;
};

function getSportId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const maybe = value as { _id?: unknown };
  return typeof maybe?._id === 'string' ? maybe._id : '';
}

function getSportName(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return '';
  const maybe = value as { name?: unknown };
  return typeof maybe?.name === 'string' ? maybe.name : '';
}

type MobileVideoPanelProps = {
  panel: HeroPanel;
  isActive: boolean;
  onClick: () => void;
};

function MobileVideoPanel({ panel, isActive, onClick }: MobileVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch((err) => {
        console.warn("Failed to play video:", err);
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <div
      onClick={onClick}
      className="relative h-full w-full flex-none snap-start overflow-hidden text-left cursor-pointer focus:outline-none"
      role="button"
      tabIndex={0}
      aria-label={panel.title}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <video
        ref={videoRef}
        className={
          'absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out ' +
          (isActive ? 'scale-110' : 'scale-100')
        }
        src={panel.videoSrc}
        loop
        muted
        playsInline
        preload="metadata"
      />

      <div
        className={
          'absolute inset-0 transition-colors duration-500 ease-in-out ' +
          (isActive ? 'bg-black/25' : 'bg-black/60')
        }
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center text-white">
        <h2 className="text-5xl font-semibold tracking-tight">{panel.title}</h2>

        <div
          className={
            'mt-3 transition-all duration-500 ease-in-out ' +
            (isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')
          }
        >
          <p className="text-sm text-white/80">Explore {panel.title} gear</p>
        </div>

        <div
          className={
            'mt-6 transition-all duration-500 ease-in-out ' +
            (isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0')
          }
        >
          {isActive ? (
            <Link
              href={`/shop-by-sport?sportId=${encodeURIComponent(panel.sportId)}`}
              className="cursor-pointer inline-flex items-center justify-center rounded-full bg-background/95 px-6 py-2 text-xs font-medium text-foreground hover:bg-background"
            >
              Shop Now
            </Link>
          ) : (
            <span
              className="cursor-pointer inline-flex items-center justify-center rounded-full bg-background/95 px-6 py-2 text-xs font-medium text-foreground hover:bg-background opacity-50"
            >
              Shop Now
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LandingVideoHero() {
  const [moduleDoc, setModuleDoc] = useState<LandingHeroBannerModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/landing/hero-banner', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch landing hero banner');
        const data = (await res.json()) as LandingHeroBannerModule;
        setModuleDoc(data);
      } catch {
        setModuleDoc(null);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const panels = useMemo(() => {
    if (moduleDoc?.isActive === false) return [] as HeroPanel[];
    const entries = Array.isArray(moduleDoc?.entries) ? moduleDoc!.entries : [];
    return entries
      .map((e, index) => {
        const sportId = getSportId(e.sport);
        const title = getSportName(e.sport) || 'Sport';
        const videoSrc = typeof e.videoUrl === 'string' && e.videoUrl.trim() ? e.videoUrl.trim() : '';
        if (!sportId || !videoSrc) return null;
        return {
          key: `${sportId}-${index}`,
          sportId,
          title,
          videoSrc,
        };
      })
      .filter(Boolean) as HeroPanel[];
  }, [moduleDoc]);

  // Desktop hover state
  const [hoveredKey, setHoveredKey] = useState<HeroPanel['key'] | null>(null);

  // Mobile active state
  const [activeKey, setActiveKey] = useState<HeroPanel['key'] | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (panels.length === 0) return;
    if (activeKey !== null) return;
    setActiveKey(panels[0].key);
  }, [activeKey, panels]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    if (width === 0) return;

    const index = Math.round(scrollLeft / width);
    if (index >= 0 && index < panels.length) {
      const targetPanel = panels[index];
      if (targetPanel && activeKey !== targetPanel.key) {
        setActiveKey(targetPanel.key);
      }
    }
  };

  const selectPanelAndScroll = (key: string, index: number) => {
    setActiveKey(key);
    const container = scrollContainerRef.current;
    if (container) {
      const width = container.clientWidth;
      container.scrollTo({
        left: width * index,
        behavior: 'smooth',
      });
    }
  };

  const anyDesktopHover = hoveredKey !== null;

  if (isLoading) {
    return (
      <section>
        <div className="hidden h-[calc(100svh-4rem)] overflow-hidden rounded-none border border-border shadow-lg md:flex" />
        <div className="md:hidden">
          <div className="h-[calc(100svh-4rem)] rounded-none border border-border" />
        </div>
      </section>
    );
  }

  if (panels.length === 0) return null;

  return (
    <section>
      {/* Desktop: 3-column flex hero */}
      <div className="hidden h-[calc(100svh-4rem)] overflow-hidden rounded-none border border-border shadow-lg md:flex">
        {panels.map((panel) => {
          const isActive = hoveredKey === panel.key;
          const isDimmed = anyDesktopHover && !isActive;

          return (
            <div
              key={panel.key}
              onMouseEnter={() => setHoveredKey(panel.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={
                'relative flex min-w-0 items-center justify-center transition-[flex-grow,transform] duration-500 ease-in-out ' +
                (isActive ? 'scale-[1.02]' : 'scale-100')
              }
              style={{ flexGrow: isActive ? 3 : 1 }}
            >
              <video
                className={
                  'absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out ' +
                  (isActive ? 'scale-110' : 'scale-100')
                }
                src={panel.videoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />

              {/* Overlay */}
              <div
                className={
                  'absolute inset-0 transition-colors duration-500 ease-in-out ' +
                  (isActive ? 'bg-black/25' : isDimmed ? 'bg-black/70' : 'bg-black/60')
                }
              />

              {/* Content */}
              <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-8 text-center text-white">
                <div
                  className={
                    'transition-all duration-500 ease-in-out ' +
                    (isActive
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-2 opacity-90')
                  }
                >
                  <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{panel.title}</h2>
                </div>

                <div
                  className={
                    'mt-3 transition-all duration-500 ease-in-out ' +
                    (isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')
                  }
                >
                  <p className="text-sm text-white/80">Explore {panel.title} gear</p>
                </div>

                <div
                  className={
                    'mt-6 transition-all duration-500 ease-in-out ' +
                    (isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0')
                  }
                >
                  <Link
                    href={`/shop-by-sport?sportId=${encodeURIComponent(panel.sportId)}`}
                    className="cursor-pointer inline-flex items-center justify-center rounded-full bg-background/95 px-6 py-2 text-xs font-medium text-foreground hover:bg-background"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>

              {/* Subtle divider between panels */}
              <div className="absolute right-0 top-0 h-full w-px bg-white/10" />
            </div>
          );
        })}
      </div>

      {/* Mobile: swipe carousel (scroll-snap) */}
      <div className="md:hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex h-[calc(100svh-4rem)] snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-none border border-border scrollbar-hide"
        >
          {panels.map((panel, index) => {
            const isActive = activeKey === panel.key;

            return (
              <MobileVideoPanel
                key={panel.key}
                panel={panel}
                isActive={isActive}
                onClick={() => selectPanelAndScroll(panel.key, index)}
              />
            );
          })}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">Swipe to explore • Tap to reveal</p>
      </div>
    </section>
  );
}
