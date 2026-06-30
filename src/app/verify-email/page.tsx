"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from "lucide-react";

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending');
  const [message, setMessage] = useState('Verifying your email address...');
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      setShowResend(true);
      return;
    }
    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`)
      .then(async res => {
        if (!res.ok) {
          const out = await res.json().catch(() => ({}));
          setStatus('error');
          setMessage(out?.message || 'Verification failed. The token may be invalid or expired.');
          setShowResend(true);
          return;
        }
        setStatus('success');
        setMessage('Your email address has been successfully verified! Redirecting to login...');
        setShowResend(false);
        setTimeout(() => router.push('/login'), 3000);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verification failed due to a network connection error.');
        setShowResend(true);
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e8edf5] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to store */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f1a2e]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to store
        </Link>

        <div className="rounded-2xl border border-[#dde4ee] bg-white p-8 shadow-lg shadow-[#0f1a2e]/06 text-center">
          {/* Logo header */}
          <div className="mb-8 flex flex-col items-center">
            <Link href="/" className="mb-6 inline-flex items-center gap-3 group">
              <div className="h-12 w-12">
                <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="cl-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c8d4e4"/>
                      <stop offset="100%" stopColor="#8898b0"/>
                    </linearGradient>
                    <linearGradient id="cl-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4a84b"/>
                      <stop offset="100%" stopColor="#9a6e08"/>
                    </linearGradient>
                    <linearGradient id="cl-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f"/>
                      <stop offset="100%" stopColor="#0f1a2e"/>
                    </linearGradient>
                  </defs>
                  <polygon points="6,62 26,18 46,62" fill="url(#cl-silver)"/>
                  <polygon points="24,62 44,8 64,62" fill="url(#cl-silver)" opacity="0.75"/>
                  <polygon points="44,8 39,24 49,24" fill="white" opacity="0.9"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#cl-gold)" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
                  <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#cl-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold tracking-widest uppercase text-[#0f1a2e] group-hover:text-[#1e3a5f] transition-colors">Highlanders</p>
                <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#c8a84b" }}>Sports &amp; Fitness</p>
              </div>
            </Link>

            <h1 className="text-2xl font-bold text-[#0f1a2e]">Verify Email</h1>
          </div>

          {/* Status Illustration */}
          <div className="mb-6 flex justify-center">
            {status === 'pending' && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f]/06">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
              </div>
            )}
            {status === 'success' && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            )}
            {status === 'error' && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            )}
          </div>

          {/* Status Message */}
          <p className={`text-sm font-medium mb-8 ${
            status === 'success' ? 'text-emerald-700' : status === 'error' ? 'text-red-600' : 'text-[#64748b]'
          }`}>
            {message}
          </p>

          {/* Resend Verification block */}
          {showResend && (
            <div className="border-t border-[#dde4ee] pt-6 text-left">
              <h2 className="text-sm font-bold text-[#0f1a2e] mb-2">Need a new link?</h2>
              <p className="text-xs text-[#64748b] mb-4">Enter your email address below to request another verification email.</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setResendStatus('sending');
                  const res = await fetch('/api/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  if (res.ok) {
                    setResendStatus('sent');
                  } else {
                    setResendStatus('error');
                  }
                }}
                className="space-y-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                />
                <button
                  type="submit"
                  disabled={resendStatus === 'sending'}
                  className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}
                >
                  {resendStatus === 'sent'
                    ? "✓ Verification email sent!"
                    : resendStatus === 'sending'
                    ? "Sending..."
                    : "Resend verification link"}
                </button>

                {resendStatus === 'error' && (
                  <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>Failed to send email. Please try again.</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-8 border-t border-[#dde4ee] pt-4 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#1e3a5f] hover:text-[#c8a84b] transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e8edf5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
