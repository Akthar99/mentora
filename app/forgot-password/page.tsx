"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus({ type: "error", message: "Please enter your email." });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus({
        type: "success",
        message: "Password reset email sent! Check your inbox.",
      });
      setEmail("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setStatus({
        type: "error",
        message: error.code === "auth/user-not-found"
          ? "No account found with that email."
          : "Failed to send reset email. Try again later.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: null, message: "" }), 5000);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-indigo-50 text-slate-800 px-6">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-md border border-slate-200 p-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/login")}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h1>
        <p className="text-slate-500 text-sm mb-6">
          Enter your email address and we’ll send you a link to reset your password.
        </p>

        {status.type && (
          <div
            className={`mb-4 p-3 rounded-md text-sm font-medium border ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block mb-1 text-slate-700 font-medium">Email Address</label>
            <div className="flex items-center border border-slate-300 rounded-md px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500">
              <Mail size={18} className="text-slate-400 mr-2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent outline-none text-slate-700"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium cursor-pointer"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </main>
  );
}
