"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending');
  const [message, setMessage] = useState('Verifying your email…');
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
          setMessage(out?.message || 'Verification failed.');
          setShowResend(true);
          return;
        }
        setStatus('success');
        setMessage('Email verified! You can now log in.');
        setShowResend(false);
        setTimeout(() => router.push('/login'), 2000);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verification failed.');
        setShowResend(true);
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground mb-2">Verify Email</h1>
        <p className={status === 'success' ? 'text-green-700' : status === 'error' ? 'text-red-700' : 'text-muted-foreground'}>{message}</p>
        {showResend && (
          <div className="mt-4">
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
              className="flex flex-col items-center gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="border px-2 py-1 rounded"
              />
              <button
                type="submit"
                className="underline text-blue-700 disabled:opacity-50"
                disabled={resendStatus === 'sending'}
              >
                {resendStatus === 'sent' ? 'Verification email sent!' : resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
              </button>
              {resendStatus === 'error' && <div className="text-xs text-red-700 mt-1">Failed to send email. Try again later.</div>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
