"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      setFormError("Invalid email or password");
      return;
    }

    router.push("/admin");
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Admin sign in</h1>
          <p className="text-xs text-muted-foreground">
            Use your admin email and password or sign in with Google.
          </p>
        </div>

        {(error || formError) && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {formError || "Authentication failed. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-[11px] font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-1"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-[11px] font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-1"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex w-full items-center justify-center rounded-lg bg-foreground py-2 text-xs font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OR
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg border bg-background py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <span className="h-4 w-4 rounded-full bg-blue-500" />
          Continue with Google
        </button>

        <div className="mt-4 text-center text-[11px] text-muted-foreground">
          <Link href="/" className="cursor-pointer hover:text-primary">
            Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center bg-background px-4" />}
    >
      <AdminLoginForm />
    </Suspense>
  );
}
