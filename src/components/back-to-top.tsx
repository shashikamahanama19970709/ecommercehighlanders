'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button if scrolled down more than 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    // Initial check in case page starts scrolled down
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#c8a84b] bg-[#0f1a2e] text-[#c8a84b] shadow-[0_4px_20px_-4px_rgba(200,168,75,0.4)] transition-all duration-500 ease-in-out md:bottom-8 md:right-8 ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 scale-90 pointer-events-none'
      } hover:-translate-y-1 hover:scale-110 hover:bg-[#1a2d4c] hover:shadow-[0_6px_24px_-4px_rgba(200,168,75,0.6)] focus:outline-none focus:ring-2 focus:ring-[#c8a84b] focus:ring-offset-2`}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}
