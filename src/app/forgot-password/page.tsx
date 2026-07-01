"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { LogoLoader } from "@/components/logo-loader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to process request.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-6">
      <div className="w-full max-w-md bg-white border border-[#dde4ee] rounded-2xl p-8 shadow-xl shadow-[#0f1a2e]/04">
        
        {/* Back to store */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f1a2e]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to store
        </Link>

        {/* Heading */}
        <div className="mb-6 text-left">
          <h2 className="text-2xl font-bold text-[#0f1a2e] uppercase font-outfit tracking-tight">Forgot Password</h2>
          <p className="mt-1.5 text-sm text-[#64748b]">
            Enter your account email to receive a password reset validation link.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-left">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex gap-3 text-xs sm:text-sm text-green-700">
              <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
              <div className="space-y-1">
                <span className="font-bold block">Reset Email Dispatched</span>
                <span className="leading-relaxed">
                  If an account exists, a secure reset link has been sent to your email mailbox. Admin password resets are routed directly to <b className="text-green-800">info@highlandersfitness.store</b>.
                </span>
              </div>
            </div>
            
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-[#0f1a2e] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e3a5f]"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {error && (
              <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] pl-10 pr-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94a3b8]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f1a2e] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LogoLoader size="xs" />
                  Sending Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-xs text-[#64748b]">
                Remembered your password?{" "}
                <Link href="/login" className="font-bold text-[#1e3a5f] hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
