'use client';

import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/use-user';
import Image from 'next/image';
import Link from 'next/link';
import { getShippingOptionsForList } from '@/lib/shipping-options';
import type { ShippingOption } from '@/types/shipping-option';
import { calculateDynamicTax, type TaxRate } from '@/lib/tax';
import { NoticeBanner, type Notice } from '@/components/notice-banner';
import { AddressBook } from '@/components/address-book';
import type { Address } from '@/types/address';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  Shield,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { LogoLoader } from '@/components/logo-loader';



const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="overflow-hidden rounded-2xl border border-[#dde4ee] bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b border-[#f0f4f8] px-5 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f1a2e]">
        <span className="text-white [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </span>
      <h2 className="text-sm font-bold tracking-tight text-[#0f1a2e]">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const inputCls =
  'w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/10';

const COUNTRIES = [
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Ireland',
  'Sri Lanka',
  'India',
  'Japan',
  'Singapore',
  'New Zealand',
  'Switzerland',
  'Norway',
  'Sweden',
  'Denmark',
  'Austria',
  'Belgium',
];

export default function CheckoutPage() {
  const { items, total, updateQuantity, removeFromCart } = useCart();
  const { formatPrice, selectedCurrency } = useCurrency();
  const { user, loading: userLoading, authenticated } = useUser();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  const [tax, setTax] = useState(0);
  const [taxRate, setTaxRate] = useState<number | null>(null);

  const [dbShippingOptions, setDbShippingOptions] = useState<ShippingOption[]>([]);
  const [dbTaxRates, setDbTaxRates] = useState<TaxRate[]>([]);

  const [guestAddress, setGuestAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'United Kingdom',
    phone: '',
  });

  const handleGuestAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGuestAddress(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'country') {
        setSelectedCountry(value);
        console.log('[Guest Checkout] Country changed directly to:', value);
      }
      return next;
    });
  };

  useEffect(() => {
    console.log('[Checkout useEffect] selectedCountry:', selectedCountry);
    console.log('[Checkout useEffect] dbShippingOptions count:', dbShippingOptions.length);
    if (dbShippingOptions.length === 0) {
      console.log('[Checkout useEffect] dbShippingOptions is empty, clearing shippingOptions');
      setShippingOptions([]);
      setSelectedShipping(null);
      return;
    }
    const opts = getShippingOptionsForList(dbShippingOptions, selectedCountry);
    console.log('[Checkout useEffect] getShippingOptionsForList returned count:', opts.length);
    const activeOpts = opts.filter(o => o.isActive !== false);
    console.log('[Checkout useEffect] activeOpts count:', activeOpts.length, activeOpts.map(o => ({ id: o.id, label: o.label, cost: o.cost })));
    setShippingOptions(activeOpts);
    const defOption = activeOpts.find(o => o.isDefault) || activeOpts[0] || null;
    console.log('[Checkout useEffect] Selected default shipping option:', defOption?.id);
    setSelectedShipping(defOption);
  }, [selectedCountry, dbShippingOptions]);

  useEffect(() => {
    console.log('[Checkout useEffect] selectedShipping:', selectedShipping?.id, 'dbTaxRates count:', dbTaxRates.length);
    if (!selectedShipping || dbTaxRates.length === 0) {
      console.log('[Checkout useEffect] No shipping option selected or no tax rates loaded. Resetting tax.');
      setTax(0);
      setTaxRate(null);
      return;
    }
    const { tax: calculatedTax, rate } = calculateDynamicTax(items, selectedCountry, dbTaxRates);
    console.log('[Checkout useEffect] calculateDynamicTax result - tax amount:', calculatedTax, 'rate:', rate);
    setTax(calculatedTax);
    setTaxRate(rate);
  }, [items, selectedCountry, selectedShipping, dbTaxRates]);

  useEffect(() => {
    setMounted(true);

    fetch('/api/settings/shipping', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data?.options)) {
          setDbShippingOptions(data.options);
        }
      })
      .catch(err => console.error('Failed to load shipping settings', err));

    fetch('/api/settings/tax', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data?.rates)) {
          setDbTaxRates(data.rates);
        }
      })
      .catch(err => console.error('Failed to load tax settings', err));
  }, []);

  if (!mounted || userLoading) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center">
        <LogoLoader size="sm" />
      </div>
    );
  }



  const handlePlaceOrder = async () => {
    setNotice(null);
    const finalEmail = (authenticated ? user?.email : email)?.trim();
    if (!finalEmail) {
      setNotice({ type: 'error', message: 'Please enter your email address to continue.' });
      return;
    }

    if (authenticated && !selectedAddress) {
      setNotice({ type: 'error', message: 'Please select a shipping address to continue.' });
      return;
    }

    if (!authenticated) {
      if (!guestAddress.name.trim()) {
        setNotice({ type: 'error', message: 'Please enter your full name for shipping.' });
        return;
      }
      if (!guestAddress.line1.trim()) {
        setNotice({ type: 'error', message: 'Please enter your street address.' });
        return;
      }
      if (!guestAddress.city.trim()) {
        setNotice({ type: 'error', message: 'Please enter your city.' });
        return;
      }
      if (!guestAddress.postalCode.trim()) {
        setNotice({ type: 'error', message: 'Please enter your postal/ZIP code.' });
        return;
      }
    }

    if (!selectedShipping) {
      setNotice({ type: 'error', message: 'Please select a shipping method to continue.' });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payload = {
        email: finalEmail,
        currency: selectedCurrency.code,
        items: items.map((i) => ({
          productId: String(i.product._id),
          quantity: i.quantity,
        })),
        shipping: selectedShipping
          ? { label: selectedShipping.label, cost: selectedShipping.cost }
          : undefined,
        tax: tax && taxRate !== null
          ? { label: `Tax (${(taxRate * 100).toFixed(0)}%)`, amount: tax }
          : undefined,
      };
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => ({}));
        setNotice({ type: 'error', message: out?.message ?? 'Checkout failed. Please try again.' });
        return;
      }
      const out = await res.json();
      if (!out?.url) {
        setNotice({ type: 'error', message: 'Checkout failed. Please try again.' });
        return;
      }
      window.location.href = out.url;
    } catch {
      setNotice({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f0f4f8]">
          <ShoppingBag className="h-10 w-10 text-[#c8d4e4]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f1a2e]">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Add some items to your cart before checking out.
          </p>
        </div>
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = total;
  const shippingCost = selectedShipping?.cost ?? 0;
  const finalTotal = subtotal + shippingCost + tax;

  return (
    <div className="flex-1 bg-[#f8fafc]">
      {/* Header bar */}
      <div className="border-b border-[#dde4ee] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f1a2e]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Continue Shopping</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8">
              <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="co-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c8d4e4" />
                    <stop offset="100%" stopColor="#8898b0" />
                  </linearGradient>
                  <linearGradient id="co-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4a84b" />
                    <stop offset="100%" stopColor="#9a6e08" />
                  </linearGradient>
                  <linearGradient id="co-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a5f" />
                    <stop offset="100%" stopColor="#0f1a2e" />
                  </linearGradient>
                </defs>
                <polygon points="6,62 26,18 46,62" fill="url(#co-silver)" />
                <polygon points="24,62 44,8 64,62" fill="url(#co-silver)" opacity="0.75" />
                <polygon points="44,8 39,24 49,24" fill="white" opacity="0.9" />
                <path
                  d="M4,68 Q22,52 42,60 Q58,66 74,52"
                  stroke="url(#co-gold)"
                  strokeWidth="4.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M4,74 Q24,62 44,68 Q60,73 76,60"
                  stroke="url(#co-navy)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </div>
            <span className="hidden text-sm font-bold tracking-widest text-[#0f1a2e] sm:inline">
              HIGHLANDERS
            </span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f1a2e]">Checkout</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            {items.length} item{items.length !== 1 ? 's' : ''} in your order
          </p>
        </div>

        {/* Notice */}
        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* Order Items */}
            <SectionCard icon={<ShoppingBag />} title="Order Review">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={String(item.product._id)}
                    className="flex gap-4 rounded-xl border border-[#f0f4f8] bg-[#f8fafc] p-3 transition-shadow hover:shadow-sm"
                  >
                    {/* Product image */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#e8edf5]">
                      {item.product.featureImageUrl ? (
                        <Image
                          src={item.product.featureImageUrl}
                          alt={item.product.name ?? ''}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-[#c8d4e4]" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <h3 className="truncate text-sm font-semibold text-[#0f1a2e]">
                          {item.product.name}
                        </h3>
                        {item.product.sku && (
                          <p className="text-xs text-[#94a3b8]">SKU: {item.product.sku}</p>
                        )}
                      </div>
                      {/* Qty controls */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dde4ee] bg-white text-[#0f1a2e] transition-all hover:bg-[#f0f4f8] disabled:opacity-40"
                          onClick={() =>
                            item.quantity > 1 &&
                            updateQuantity(String(item.product._id), item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          className="h-7 w-12 rounded-lg border border-[#dde4ee] bg-white text-center text-sm font-medium text-[#0f1a2e] outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(String(item.product._id), Number(e.target.value))
                          }
                        />
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dde4ee] bg-white text-[#0f1a2e] transition-all hover:bg-[#f0f4f8]"
                          onClick={() =>
                            updateQuantity(String(item.product._id), item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeFromCart(String(item.product._id))}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-[#0f1a2e]">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-[#94a3b8]">
                          {formatPrice(item.product.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>


            </SectionCard>

            {/* Shipping Address */}
            <SectionCard icon={<Truck />} title="Shipping Address">
              {authenticated ? (
                <AddressBook
                  selectedId={selectedAddress?._id}
                  onSelect={(addr) => {
                    setSelectedAddress(addr);
                    if (addr.country) {
                      setSelectedCountry(addr.country);
                    }
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-[#f0f4f8] pb-3 mb-3">
                    <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Contact & Shipping Details</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="name"
                        placeholder="Full name"
                        value={guestAddress.name}
                        onChange={handleGuestAddressChange}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                        Phone Number <span className="text-[#94a3b8] font-normal">(Optional)</span>
                      </label>
                      <input
                        name="phone"
                        placeholder="Phone number"
                        value={guestAddress.phone}
                        onChange={handleGuestAddressChange}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="line1"
                      placeholder="Street address or P.O. Box"
                      value={guestAddress.line1}
                      onChange={handleGuestAddressChange}
                      className={inputCls}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      Address Line 2 <span className="text-[#94a3b8] font-normal">(Optional)</span>
                    </label>
                    <input
                      name="line2"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      value={guestAddress.line2}
                      onChange={handleGuestAddressChange}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="city"
                        placeholder="City"
                        value={guestAddress.city}
                        onChange={handleGuestAddressChange}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                        Region / State <span className="text-[#94a3b8] font-normal">(Optional)</span>
                      </label>
                      <input
                        name="region"
                        placeholder="Region or State"
                        value={guestAddress.region}
                        onChange={handleGuestAddressChange}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                        Postal / ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="postalCode"
                        placeholder="Postal or ZIP code"
                        value={guestAddress.postalCode}
                        onChange={handleGuestAddressChange}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="country"
                        value={guestAddress.country}
                        onChange={handleGuestAddressChange}
                        className={inputCls}
                        required
                      >
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-[#94a3b8] pt-2">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#1e3a5f] font-medium hover:underline">
                      Sign in
                    </Link>{' '}
                    to use your saved addresses.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Shipping Method */}
            <SectionCard icon={<Truck />} title="Shipping Method">
              <div className="space-y-3">
                {shippingOptions.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    No active shipping methods match the selected country/region ({selectedCountry}).
                  </p>
                ) : (
                  shippingOptions.map((opt) => {
                    const isSelected = selectedShipping?.id === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                          isSelected
                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/04 shadow-sm'
                            : 'border-[#dde4ee] hover:border-[#c8d4e4] hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => setSelectedShipping(opt)}
                        />
                        {/* Custom radio */}
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            isSelected ? 'border-[#1e3a5f]' : 'border-[#dde4ee]'
                          }`}
                        >
                          {isSelected && (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#1e3a5f]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#0f1a2e]">{opt.label}</p>
                          {opt.estimate && (
                            <p className="text-xs text-[#94a3b8]">{opt.estimate}</p>
                          )}
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? 'text-[#1e3a5f]' : 'text-[#0f1a2e]'
                          }`}
                        >
                          {opt.cost === 0 ? (
                            <span className="text-emerald-600">Free</span>
                          ) : (
                            formatPrice(opt.cost)
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </SectionCard>

            {/* Payment info notice (Stripe handles actual payment) */}
            <SectionCard icon={<CreditCard />} title="Payment">
              <div className="flex items-start gap-3 rounded-xl border border-[#e8f4fd] bg-[#f0f9ff] p-4">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-[#0f1a2e]">Secure payment via Stripe</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#64748b]">
                    You will be redirected to Stripe&apos;s secure checkout to enter your card
                    details. We never store your payment information.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'].map((method) => (
                  <span
                    key={method}
                    className="rounded-lg border border-[#dde4ee] bg-white px-3 py-1.5 text-xs font-medium text-[#64748b]"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT COLUMN — Order Summary */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">
              {/* Summary Card */}
              <div className="overflow-hidden rounded-2xl border border-[#dde4ee] bg-white shadow-sm">
                <div className="border-b border-[#f0f4f8] px-5 py-4">
                  <h2 className="text-sm font-bold text-[#0f1a2e]">Order Summary</h2>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {/* Line items */}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">
                      Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})
                    </span>
                    <span className="font-semibold text-[#0f1a2e]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Shipping</span>
                    <span className="font-semibold text-[#0f1a2e]">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-600">Free</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>
                  {taxRate !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748b]">
                        Tax ({(taxRate * 100).toFixed(0)}%)
                      </span>
                      <span className="font-semibold text-[#0f1a2e]">{formatPrice(tax)}</span>
                    </div>
                  )}


                  {/* Divider */}
                  <div className="border-t border-[#f0f4f8] pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-[#0f1a2e]">Total</span>
                      <span className="text-xl font-black text-[#0f1a2e]">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-right text-[10px] text-[#94a3b8]">
                      Incl. all taxes &amp; fees
                    </p>
                  </div>
                </div>

                {/* Place order CTA */}
                <div className="border-t border-[#f0f4f8] px-5 pb-5 pt-4">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full rounded-xl py-4 text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
                    style={{
                      background: isPlacingOrder
                        ? '#64748b'
                        : 'linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)',
                    }}
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <LogoLoader size="xs" />
                        Processing…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Lock className="h-4 w-4" />
                        Place Order — {formatPrice(finalTotal)}
                      </span>
                    )}
                  </button>

                  {/* Trust line */}
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#94a3b8]">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    <span>256-bit SSL encrypted &amp; secure</span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}