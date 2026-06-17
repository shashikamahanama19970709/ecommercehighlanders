"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ShopBySportModule } from '@/types/shop-by-sport';

async function fetchShopBySportModule(signal?: AbortSignal) {
  const res = await fetch('/api/shop-by-sport', {
    cache: 'no-store',
    signal,
  });

  if (!res.ok) return null;
  return (await res.json()) as ShopBySportModule;
}

export default function Footer() {
  const [shopBySportModule, setShopBySportModule] = useState<ShopBySportModule | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const data = await fetchShopBySportModule(controller.signal);
        setShopBySportModule(data);
      } catch (error) {
        // Avoid unhandled promise rejections / noisy logs in the browser.
        if (controller.signal.aborted) return;
        setShopBySportModule(null);
      }
    })();

    return () => controller.abort();
  }, []);

  // Extract unique sports from shop by sport entries
  const sports = useMemo(() => {
    if (!Array.isArray(shopBySportModule?.entries)) return [];

    return shopBySportModule.entries
      .map((entry) => entry.sport)
      .filter((sport) => {
        return (
          !!sport &&
          typeof sport === 'object' &&
          '_id' in sport &&
          'name' in sport &&
          typeof (sport as { _id?: unknown })._id === 'string' &&
          typeof (sport as { name?: unknown }).name === 'string'
        );
      })
      .map((sport) => sport as { _id: string; name: string })
      .filter((sport, index, self) => self.findIndex((s) => s._id === sport._id) === index);
  }, [shopBySportModule]);

  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white">Sportify-Ecommerce</h3>
            <p className="mt-2 text-sm text-gray-400">
              Your one-stop shop for cricket, football, gym and more.
            </p>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Shop by Sport</h4>
            <ul className="mt-4 space-y-2">
              {sports.map((sport) => (
                <li key={sport._id}>
                  <Link
                    href={`/shop-by-sport`}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200"
                  >
                    {sport.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>



          {/* Customer Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Customer Support</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Contact Us</h4>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400 shrink-0">🏪</span>
                <span className="text-sm text-gray-400">Sportify Highlanders Store</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400 shrink-0">📍</span>
                <span className="text-sm text-gray-400">123 Sports Avenue, Colombo 03, Sri Lanka</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400 shrink-0">📞</span>
                <a href="tel:+94112345678" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  +94 11 234 5678
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400 shrink-0">✉️</span>
                <a href="mailto:info@sportify.lk" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  info@sportify.lk
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400 shrink-0">🗺️</span>
                <a
                  href="https://maps.google.com/?q=Colombo,Sri+Lanka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200"
                >
                  View on Google Maps
                </a>
              </li>
            </ul>
          </div>


        </div>

        {/* Social Media Icons */}
        <div className="mt-8 flex justify-center space-x-6 lg:justify-start">
          <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
            Facebook
          </a>
          <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
            Instagram
          </a>
          <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
            Twitter
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-400">
              © {currentYear} Sportify-Ecommerce. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Powered by{' '}
              <a
                href="https://flexnodelive.site/"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                FlexNode
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}