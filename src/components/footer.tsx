import Link from 'next/link';
import type { Sport } from '@/types/product';
import type { ShopBySportModule } from '@/types/shop-by-sport';

async function fetchShopBySportModule() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/shop-by-sport`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as ShopBySportModule;
}

export default async function Footer() {
  const shopBySportModule = await fetchShopBySportModule();
  const currentYear = new Date().getFullYear();

  // Extract unique sports from shop by sport entries
  const sports = Array.isArray(shopBySportModule?.entries)
    ? shopBySportModule.entries
        .map(entry => entry.sport)
        .filter((sport) =>
          sport && typeof sport === 'object' && '_id' in sport && 'name' in sport && typeof sport._id === 'string' && typeof sport.name === 'string'
        )
        .map(sport => sport as { _id: string; name: string })
        .filter((sport, index, self) =>
          self.findIndex(s => s._id === sport._id) === index
        )
    : [];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
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

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/orders-returns" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  Orders & Returns
                </Link>
              </li>
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

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Newsletter</h4>
            <p className="mt-2 text-sm text-gray-400">
              Subscribe to get updates on new products and offers.
            </p>
            <form className="mt-4">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-l-md border-0 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-r-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  Subscribe
                </button>
              </div>
            </form>
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