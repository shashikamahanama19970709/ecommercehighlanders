"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Shield } from "lucide-react";

function AdminLoginForm() {
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setFormError("Please verify your email before logging in. Check your inbox.");
        setShowResend(true);
      } else {
        setFormError("Invalid email or password. Please try again.");
        setShowResend(false);
      }
      return;
    }

    router.push("/admin");
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/admin" });
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
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div
        className="relative hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col items-center justify-center overflow-hidden px-12"
        style={{ background: "linear-gradient(145deg, #0f1a2e 0%, #1e3a5f 50%, #0d1625 100%)" }}
      >
        {/* Background mountain pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true">
          <svg viewBox="0 0 600 600" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <polygon points="0,600 150,100 300,600" fill="white"/>
            <polygon points="200,600 350,50 500,600" fill="white"/>
            <polygon points="350,600 500,150 650,600" fill="white"/>
          </svg>
        </div>

        {/* Gold top glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl" style={{ background: "#c8a84b" }} />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-4">
            <div className="h-16 w-16">
              <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="adm-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e8edf5"/>
                    <stop offset="100%" stopColor="#8898b0"/>
                  </linearGradient>
                  <linearGradient id="adm-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4a84b"/>
                    <stop offset="100%" stopColor="#9a6e08"/>
                  </linearGradient>
                  <linearGradient id="adm-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3a5f8a"/>
                    <stop offset="100%" stopColor="#1e3a5f"/>
                  </linearGradient>
                </defs>
                <polygon points="6,62 26,18 46,62" fill="url(#adm-silver)"/>
                <polygon points="24,62 44,8 64,62" fill="url(#adm-silver)" opacity="0.75"/>
                <polygon points="44,8 39,24 49,24" fill="white" opacity="0.95"/>
                <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#adm-gold)" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
                <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#adm-navy)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-2xl font-black tracking-widest uppercase text-white">Highlanders</p>
              <p className="text-xs font-bold tracking-[0.22em] uppercase" style={{ color: "#c8a84b" }}>
                Sports &amp; Fitness
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
              Admin Control<br />
              <span style={{ color: "#c8a84b" }}>Center</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Manage your store, inventory, and orders<br />from one powerful dashboard.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
            {[
              { label: "Products", value: "500+" },
              { label: "Orders", value: "10K+" },
              { label: "Sports", value: "15+" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 p-3 text-center"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Gold accent line */}
          <div className="mt-10 h-px w-24 rounded-full" style={{ background: "linear-gradient(90deg, transparent, #c8a84b, transparent)" }} />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/25">
            Train Like a Champion
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">

          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="h-10 w-10">
              <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="adm-mb-s" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c8d4e4"/>
                    <stop offset="100%" stopColor="#8898b0"/>
                  </linearGradient>
                  <linearGradient id="adm-mb-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4a84b"/>
                    <stop offset="100%" stopColor="#9a6e08"/>
                  </linearGradient>
                </defs>
                <polygon points="6,62 26,18 46,62" fill="url(#adm-mb-s)"/>
                <polygon points="24,62 44,8 64,62" fill="url(#adm-mb-s)" opacity="0.75"/>
                <polygon points="44,8 39,24 49,24" fill="#1e3a5f" opacity="0.9"/>
                <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#adm-mb-g)" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-widest uppercase text-[#0f1a2e]">Highlanders</p>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#c8a84b" }}>Sports &amp; Fitness</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f1a2e]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#0f1a2e]">Admin Sign In</h2>
            <p className="mt-1.5 text-sm text-[#64748b]">
              Authorized personnel only. Use your admin credentials.
            </p>
          </div>

          {/* Error Alert */}
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
                      className="text-sm font-semibold text-red-600 hover:text-red-800 underline underline-offset-2 disabled:opacity-50"
                      disabled={resendStatus === "sending"}
                      onClick={handleResend}
                    >
                      {resendStatus === "sent"
                        ? "✓ Email sent!"
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
              <label htmlFor="email" className="block text-sm font-semibold text-[#0f1a2e]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@highlanderssports.lk"
                className="w-full rounded-xl border border-[#dde4ee] bg-white px-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/12"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-[#0f1a2e]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full rounded-xl border border-[#dde4ee] bg-white px-4 py-3 pr-12 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/12"
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
              className="relative w-full overflow-hidden rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2 focus:ring-offset-[#f8fafc]"
              style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e2e8f0]" />
            <span className="text-xs font-medium text-[#94a3b8]">or continue with</span>
            <div className="h-px flex-1 bg-[#e2e8f0]" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#dde4ee] bg-white px-4 py-3 text-sm font-semibold text-[#0f1a2e] shadow-sm transition-all duration-150 hover:bg-[#f8fafc] hover:border-[#c8d4e4] hover:shadow focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
          >
            {/* Google SVG logo */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#0f1a2e] transition-colors"
            >
              <svg className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back to store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
