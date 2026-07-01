"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { LogoLoader } from "@/components/logo-loader";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please request another reset link.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs sm:text-sm text-red-700">
        <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-[#0f1a2e] mb-1">Missing Reset Token</h3>
        <p className="text-slate-500 mb-4">You cannot reset your password without a valid reset token reference.</p>
        <Link href="/forgot-password" className="font-bold text-[#1e3a5f] hover:underline">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-[#dde4ee] rounded-2xl p-8 shadow-xl shadow-[#0f1a2e]/04 text-left">
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0f1a2e] uppercase font-outfit tracking-tight">Specify New Password</h2>
        <p className="mt-1.5 text-sm text-[#64748b]">
          Enter your new password to regain access to your account.
        </p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex gap-3 text-xs sm:text-sm text-green-700">
            <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
            <div className="space-y-1">
              <span className="font-bold block">Password Updated</span>
              <span className="leading-relaxed">
                Your credentials have been successfully updated. You may now sign in using your new password.
              </span>
            </div>
          </div>
          
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl bg-[#0f1a2e] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e3a5f]"
          >
            Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] pl-10 pr-10 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94a3b8]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#94a3b8] hover:text-[#0f1a2e]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] pl-10 pr-10 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94a3b8]" />
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
                Updating Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-6">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white border border-[#dde4ee] rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center gap-3">
          <LogoLoader size="sm" />
          <span className="text-sm text-[#64748b]">Verifying reset details...</span>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
