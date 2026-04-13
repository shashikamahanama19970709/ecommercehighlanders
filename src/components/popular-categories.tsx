'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Sport } from '@/types/product';

interface PopularCategoriesProps {
  sports: Sport[];
}

export function PopularCategories({ sports }: PopularCategoriesProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create looped content: duplicate sports at beginning and end
  const loopedSports = [...sports, ...sports, ...sports];

  // Calculate the width of one set of sports
  const itemWidth = 192; // w-48 (192px) from the className
  const gap = 16; // gap-4 (16px)
  const totalItemWidth = itemWidth + gap;
  const sportsSetWidth = sports.length * totalItemWidth;

  useEffect(() => {
    const container = sliderRef.current;
    if (!container || isInitialized) return;

    // Set initial scroll position to the middle set (real content)
    const initialScrollLeft = sportsSetWidth;
    container.scrollLeft = initialScrollLeft;
    setIsInitialized(true);
  }, [sportsSetWidth, isInitialized]);

  useEffect(() => {
    const container = sliderRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      // If scrolled to the end duplicate (third set), jump to beginning real content (first set)
      if (scrollLeft >= sportsSetWidth * 2) {
        container.scrollLeft = sportsSetWidth;
      }
      // If scrolled to the beginning duplicate (first set), jump to end real content (second set)
      else if (scrollLeft <= sportsSetWidth - containerWidth) {
        container.scrollLeft = sportsSetWidth * 2 - containerWidth;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sportsSetWidth]);

  const scrollLeftHandler = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -totalItemWidth, behavior: 'smooth' });
    }
  };

  const scrollRightHandler = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: totalItemWidth, behavior: 'smooth' });
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Prevent default drag behavior
  useEffect(() => {
    const preventDefault = (e: Event) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    document.addEventListener('dragstart', preventDefault);
    return () => document.removeEventListener('dragstart', preventDefault);
  }, [isDragging]);

  if (!sports.length) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Popular Categories</h2>
          <p className="text-muted-foreground">No sports categories available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Popular Categories</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeftHandler}
            className="cursor-pointer rounded-full border border-border p-2 text-foreground hover:bg-muted transition-colors"
            aria-label="Scroll left"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link
            href="/admin/sports"
            className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
          >
            View All
          </Link>
          <button
            onClick={scrollRightHandler}
            className="cursor-pointer rounded-full border border-border p-2 text-foreground hover:bg-muted transition-colors"
            aria-label="Scroll right"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={sliderRef}
          className={`flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {loopedSports.map((sport, index) => (
            <div
              key={`${sport._id}-${index}`}
              className="flex-shrink-0 w-48 cursor-pointer group select-none"
            >
              <div className="relative overflow-hidden rounded-xl p-6 transition hover:-translate-y-1">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border border-border">
                    {sport.imageUrl ? (
                      <Image
                        src={sport.imageUrl}
                        alt={sport.name}
                        width={96}
                        height={96}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border text-foreground text-lg font-bold">
                        {sport.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{sport.name}</h3>
                  
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}