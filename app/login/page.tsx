"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; pwd?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!pwd) next.pwd = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      alert("Signed in (mock). Next: wire real auth.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:grid-cols-2">
        
        {/* LEFT PANEL */}
        <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-br from-gray-100 via-gray-200 to-white p-10 text-slate-800">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back 👋</h2>
            <p className="mt-2 text-slate-600 text-sm">
              Continue your AI-powered learning journey with Mentora.
            </p>
          </div>

          <div className="relative flex justify-center mt-10">
            <Image
              src="/mentora-logo.png"
              alt="Mentora logo"
              width={260}
              height={260}
              priority
              className="drop-shadow-2xl animate-float logo-glow"
            />
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            © {new Date().getFullYear()} Mentora. All rights reserved.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="text-center mb-6">
            <Image
              src="/robo.png"
              alt="Mentora robot"
              width={70}
              height={70}
              priority
              className="mx-auto mb-3"
            />
            <h1 className="text-2xl font-semibold text-slate-800">
              Sign in to Mentora
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  placeholder="********"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-indigo-600"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              {errors.pwd && <p className="mt-1 text-xs text-red-600">{errors.pwd}</p>}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <Link href="#" className="text-indigo-600 hover:underline hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white outline-none ring-offset-2 transition-all hover:bg-indigo-700 hover:shadow-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-white" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">or continue with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Google Button */}
           {/* Google Sign-In Button (Monotone Gray Style) */}
 <button
              type="button"
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-all"
              onClick={() => alert('Google sign-in (mock). Next: wire NextAuth.')}
            >
              <GoogleIcon className="h-4 w-4" />
              Sign in with Google
            </button>


            {/* Sign up */}
            <p className="text-center text-sm text-slate-500">
              Don’t have an account?{" "}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
      
    </main>
  );
  
}


function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.618-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.011,35.638,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  );
}

