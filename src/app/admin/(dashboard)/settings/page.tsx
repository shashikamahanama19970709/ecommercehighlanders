"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession, signOut } from "next-auth/react";
import { Shield, User, Lock, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  
  // Form states
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Verification states
  const [step, setStep] = useState<"edit" | "verify">("edit");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize fields from active session
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  // Request verification code to info@highlandersfitness.store
  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/profile/request-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to request verification code.");
      }

      setStep("verify");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Submit verification code to save updates
  async function handleVerifyAndSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid verification code.");
      }

      setSuccess(true);
      
      // Auto sign out after 3 seconds to force re-authentication
      setTimeout(async () => {
        await signOut({ redirect: false });
        window.location.href = "/admin/login";
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Failed to verify. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="overflow-hidden bg-white border border-[#e8edf5] rounded-3xl shadow-sm">
        
        {/* Navy Header Banner */}
        <div className="relative px-8 py-8 text-white" style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden="true">
            <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
              <polygon points="0,100 50,20 100,100" fill="white"/>
            </svg>
          </div>
          <div className="relative z-10 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8a84b]/15 text-[#c8a84b] mb-3">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wide">Admin Account Settings</h2>
            <p className="text-xs text-white/60 mt-1">Update administrator profile details and login passwords securely.</p>
          </div>
        </div>

        <div className="p-8 text-left">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex gap-4 text-sm text-green-700">
                <CheckCircle className="h-6 w-6 shrink-0 text-green-500" />
                <div className="space-y-1">
                  <span className="font-bold block">Credentials Saved Successfully</span>
                  <span className="leading-relaxed block">
                    Admin profile details updated. You will be signed out and redirected to login in a moment...
                  </span>
                </div>
              </div>
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#0f1a2e]" />
              </div>
            </div>
          ) : step === "edit" ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
              {error && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">Admin Email (Static)</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={session?.user?.email || "admin@example.com"}
                    className="w-full rounded-xl border border-[#dde4ee] bg-[#f1f5f9] pl-10 pr-4 py-3 text-sm text-[#64748b] cursor-not-allowed outline-none"
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94a3b8]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">Admin Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Administrator"
                    className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] pl-10 pr-4 py-3 text-sm text-[#0f1a2e] outline-none focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                  />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94a3b8]" />
                </div>
              </div>

              <div className="border-t border-[#e8edf5] pt-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Change Password (Optional)</h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">New Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] pl-10 pr-4 py-3 text-sm text-[#0f1a2e] outline-none focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                      />
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94a3b8]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">Confirm Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] pl-10 pr-4 py-3 text-sm text-[#0f1a2e] outline-none focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                      />
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94a3b8]" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0f1a2e] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Requesting Verification...
                  </>
                ) : (
                  "Request Verification Code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndSave} className="space-y-6">
              {error && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs sm:text-sm text-blue-700">
                <CheckCircle className="h-5 w-5 shrink-0 text-blue-500" />
                <span>
                  We have sent a 6-digit verification code to <b className="text-blue-800">info@highlandersfitness.store</b>. Please enter the code below to authorize profile changes.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">6-Digit Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-xl font-bold tracking-widest rounded-xl border border-[#dde4ee] bg-[#f8fafc] py-3 text-[#0f1a2e] outline-none focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("edit")}
                  className="flex-1 rounded-xl border border-[#dde4ee] px-4 py-3 text-sm font-semibold text-[#64748b] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#0f1a2e] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    "Verify & Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
