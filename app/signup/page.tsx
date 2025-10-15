"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";

type Errors = {
  name?: string;
  email?: string;
  pwd?: string;
  confirm?: string;
  terms?: string;
  general?: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  // Password strength meter
  const score = useMemo(() => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[a-z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  }, [pwd]);

  const label = useMemo(() => {
    if (!pwd) return "";
    if (score <= 2) return "Weak";
    if (score === 3) return "Moderate";
    if (score === 4) return "Strong";
    return "Very strong";
  }, [pwd, score]);

  // Validation
  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!pwd) next.pwd = "Password is required.";
    else if (pwd.length < 8) next.pwd = "Password must be at least 8 characters.";
    if (!confirm) next.confirm = "Please confirm your password.";
    else if (confirm !== pwd) next.confirm = "Passwords do not match.";
    if (!acceptTerms) next.terms = "You must accept the Terms & Privacy.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ✅ Handle Firebase Signup
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setStatus({ type: null, message: "" });

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pwd);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      setStatus({ type: "success", message: "Account created successfully!" });

      // Redirect after short delay
      setTimeout(() => router.push("/profile"), 2000);
    } catch (error: any) {
      console.error(error.code, error.message);
      const next: Errors = {};
      if (error.code === "auth/email-already-in-use") next.email = "Email already in use.";
      else if (error.code === "auth/invalid-email") next.email = "Invalid email format.";
      else if (error.code === "auth/weak-password") next.pwd = "Password is too weak.";
      else next.general = "Signup failed. Try again later.";
      setErrors(next);
      setStatus({
        type: "error",
        message:
          next.email || next.pwd || next.general || "Signup failed. Please check your input.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: null, message: "" }), 4000);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:grid-cols-2">
        {/* LEFT SIDE — FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="text-center mb-6">
            <Image
              src="/robo.png"
              alt="Mentora robot"
              width={50}
              height={60}
              priority
              className="mx-auto mb-3"
            />
            <h1 className="text-2xl font-semibold text-slate-800">
              Create your Mentora account
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Join our AI-powered education platform today.
            </p>
          </div>

          {/* ✅ Status message */}
          {status.type && (
            <div
              className={`mb-4 p-3 rounded-md text-sm font-medium transition-all ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {errors.general && (
              <p className="text-center text-sm text-red-600">{errors.general}</p>
            )}

            {/* Full name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                placeholder="R H Musab"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  placeholder="At least 8 characters"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-indigo-600"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              {errors.pwd && <p className="mt-1 text-xs text-red-600">{errors.pwd}</p>}

              {!!pwd && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 w-full rounded transition-all ${
                          i < score ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{label}</div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-indigo-600"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 text-sm">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="text-slate-600">
                I agree to the{" "}
                <Link href="#" className="text-indigo-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
            {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 hover:shadow-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-white" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* RIGHT SIDE — GRADIENT PANEL */}
        <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-br from-gray-100 via-gray-200 to-white p-10 text-slate-800">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">
              Join Mentora
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Explore AI-powered learning tools and elevate your education journey.
            </p>
          </div>

          <div className="relative flex justify-center mt-10">
            <Image
              src="/chatbot.png"
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
      </div>
    </main>
  );
}
