"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setFormError("Please verify your email before logging in. Check your inbox for a verification link.");
        setShowResend(true);
      } else {
        setFormError("Invalid email or password");
        setShowResend(false);
      }
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Customer Login</h1>
          <p className="text-xs text-muted-foreground">Sign in to your customer account.</p>
        </div>
        {(error || formError) && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {formError || "Authentication failed. Please try again."}
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
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-[11px] font-medium text-zinc-700">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-1" />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-[11px] font-medium text-zinc-700">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-1" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/register" className="underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background px-4" /> }>
      <CustomerLoginForm />
    </Suspense>
  );
}
