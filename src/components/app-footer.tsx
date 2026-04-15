'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/footer';

export function AppFooter() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return <Footer />;
}
