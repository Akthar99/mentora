// app/splash/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SplashPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false); // true = faded in, false = hidden
  const splashDuration = 2500; // total time on splash (ms)
  const fadeOutBefore = 300; // time before redirect to start fade-out (ms)

  useEffect(() => {
    // small delay to trigger fade-in
    const inTimer = setTimeout(() => setVisible(true), 50);

    // start fade-out shortly before redirect
    const outTimer = setTimeout(() => setVisible(false), splashDuration - fadeOutBefore);

    // navigate after full duration
    const redirectTimer = setTimeout(() => {
      router.push("/login");
    }, splashDuration);

    return () => {
      clearTimeout(inTimer);
      clearTimeout(outTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  // Build classes from visible state
  const containerClasses = [
    "relative min-h-dvh overflow-hidden",
    "bg-gradient-to-b from-white via-indigo-50 to-purple-50",
    "transition-opacity duration-500 ease-out", // fade transitions
    visible ? "opacity-100" : "opacity-0",
  ].join(" ");

  return (
    <main className={containerClasses}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-indigo-200/50 blur-2xl" />
      <div className="pointer-events-none absolute right-10 top-20 h-24 w-24 rounded-full bg-purple-200/50 blur-xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-28 w-28 rounded-full bg-blue-200/50 blur-xl" />

      {/* Centered content */}
      <section className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="mb-2">
          <Image
            src="/robo.png"
            alt="Mentora logo"
            width={72}
            height={72}
            priority
            className="drop-shadow-sm animate-float"
          />
        </div>

        <h1 className="text-3xl font-semibold text-slate-900">Mentora</h1>
        <p className="mt-2 text-slate-600">Where AI Meets Education</p>

        {/* Small bouncing loader */}
        <div className="mt-8 flex items-center gap-2 text-slate-500">
          <div className="flex gap-1">
            <span className="h-5 w-5 rounded-full bg-gray-500 animate-bounce" />
            <span className="h-5 w-5 rounded-full bg-gray-500 animate-bounce delay-200" />
            <span className="h-5 w-5 rounded-full bg-gray-500 animate-bounce delay-400" />
          </div>
        </div>
      </section>
    </main>
  );
}
