"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const out = await res.json().catch(() => ({}));
      setError(out?.message || "Registration failed");
      if (out?.message && out.message.includes('already exists')) setShowResend(true);
      else setShowResend(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Create your account</h1>
          <p className="text-xs text-muted-foreground">Sign up to track orders and save your details.</p>
        </div>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
            {showResend && (
              <div className="mt-2">
                <button
                  type="button"
                  className="underline text-blue-700 disabled:opacity-50"
                  disabled={resendStatus === 'sending'}
                  onClick={async () => {
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
                >
                  {resendStatus === 'sent' ? 'Verification email sent!' : resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
                </button>
                {resendStatus === 'error' && <div className="text-xs text-red-700 mt-1">Failed to send email. Try again later.</div>}
              </div>
            )}
          </div>
        )}
        {success && <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">Account created! Redirecting…</div>}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-[11px] font-medium text-zinc-700">Name</label>
            <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-1" />
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-[11px] font-medium text-zinc-700">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-1" />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-[11px] font-medium text-zinc-700">Password</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-1" />
          </div>
          <button type="submit" className="w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50" disabled={loading}>{loading ? "Registering…" : "Register"}</button>
        </form>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account? <Link href="/login" className="underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
