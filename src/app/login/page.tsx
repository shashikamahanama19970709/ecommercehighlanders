"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { LogoLoader } from "@/components/logo-loader";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      const validateRes = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const validateData = await validateRes.json().catch(() => ({}));

      if (!validateRes.ok || !validateData.success) {
        setLoading(false);
        if (validateData.error === "email_not_verified") {
          setFormError("Please verify your email before logging in. Check your inbox for a verification link.");
          setShowResend(true);
        } else {
          setFormError("Invalid email or password. Please try again.");
          setShowResend(false);
        }
        return;
      }

      // Pre-validation succeeded, proceed with NextAuth sign-in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setFormError("Invalid email or password. Please try again.");
        setShowResend(false);
        return;
      }

      router.push("/");
    } catch (err) {
      setLoading(false);
      setFormError("An unexpected error occurred. Please try again.");
      console.error("Login submission error:", err);
    }
  }

  async function handleResend() {
    setResendStatus("sending");
    const res = await fetch("/api/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendStatus(res.ok ? "sent" : "error");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e8edf5] px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Back to store */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f1a2e]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to store
        </Link>

        <div className="rounded-2xl border border-[#dde4ee] bg-white p-8 shadow-lg shadow-[#0f1a2e]/06">

          {/* Logo header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Link href="/" className="mb-5 inline-flex items-center gap-3 group">
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

            <h1 className="text-2xl font-bold text-[#0f1a2e]">Welcome back</h1>
            <p className="mt-1.5 text-sm text-[#64748b]">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {(error || formError) && (
            <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">
                  {formError || "Authentication failed. Please try again."}
                </p>
                {showResend && (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-600 underline underline-offset-2 hover:text-red-800 disabled:opacity-50"
                      disabled={resendStatus === "sending"}
                      onClick={handleResend}
                    >
                      {resendStatus === "sent"
                        ? "✓ Verification email sent!"
                        : resendStatus === "sending"
                        ? "Sending…"
                        : "Resend verification email"}
                    </button>
                    {resendStatus === "error" && (
                      <p className="mt-1 text-xs text-red-600">Failed to send. Try again later.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="customer-email" className="block text-sm font-semibold text-[#0f1a2e]">
                Email address
              </label>
              <input
                id="customer-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="customer-password" className="block text-sm font-semibold text-[#0f1a2e]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-[#1e3a5f] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="customer-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] px-4 py-3 pr-12 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f1a2e] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
              style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LogoLoader size="xs" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register CTA */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748b]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#1e3a5f] hover:text-[#c8a84b] transition-colors underline-offset-2 hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e2e8f0]" />
            <span className="text-xs text-[#94a3b8]">secure &amp; encrypted</span>
            <div className="h-px flex-1 bg-[#e2e8f0]" />
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-[#94a3b8]">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              SSL secured
            </span>
            <span className="h-3 w-px bg-[#e2e8f0]" />
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Privacy protected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e8edf5]">
          <LogoLoader size="sm" />
        </div>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
