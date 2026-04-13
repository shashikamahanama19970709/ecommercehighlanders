'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type HeroPanel = {
  key: 'cricket' | 'football' | 'gym';
  title: string;
  subtitle: string;
  videoSrc: string;
};

const PANELS: HeroPanel[] = [
  {
    key: 'cricket',
    title: 'Cricket',
    subtitle: 'Bats, pads, gloves',
    videoSrc: '/videos/cricket.mp4',
  },
  {
    key: 'football',
    title: 'Football',
    subtitle: 'Boots, balls, kits',
    videoSrc: '/videos/football.mp4',
  },
  {
    key: 'gym',
    title: 'Gym',
    subtitle: 'Weights & accessories',
    videoSrc: '/videos/gym.mp4',
  },
];

export function LandingVideoHero() {
  const panels = useMemo(() => PANELS, []);

  // Desktop hover state
  const [hoveredKey, setHoveredKey] = useState<HeroPanel['key'] | null>(null);

  // Mobile tap state
  const [activeKey, setActiveKey] = useState<HeroPanel['key']>(panels[0].key);

  const anyDesktopHover = hoveredKey !== null;

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
                  <p className="text-sm text-white/80">{panel.subtitle}</p>
                </div>

                <div
                  className={
                    'mt-6 transition-all duration-500 ease-in-out ' +
                    (isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0')
                  }
                >
                  <Link
                    href="/shop-by-sport"
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
        <div className="flex h-[calc(100svh-4rem)] snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-none border border-border scrollbar-hide">
          {panels.map((panel) => {
            const isActive = activeKey === panel.key;

            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => setActiveKey(panel.key)}
                className="relative h-full w-full flex-none snap-start overflow-hidden text-left"
                aria-label={panel.title}
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
                    <p className="text-sm text-white/80">{panel.subtitle}</p>
                  </div>

                  <div
                    className={
                      'mt-6 transition-all duration-500 ease-in-out ' +
                      (isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0')
                    }
                  >
                    <Link
                      href="/shop-by-sport"
                      className="cursor-pointer inline-flex items-center justify-center rounded-full bg-background/95 px-6 py-2 text-xs font-medium text-foreground hover:bg-background"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">Swipe to explore • Tap to reveal</p>
      </div>
    </section>
  );
}
