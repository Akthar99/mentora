"use client";

import Image from "next/image";

export default function LoadingScreen() {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-white via-indigo-50 to-purple-50">
      <Image
        src="/robo.png"
        alt="Mentora logo"
        width={72}
        height={72}
        priority
        className="drop-shadow-sm animate-float"
      />
      <h1 className="mt-3 text-3xl font-semibold text-slate-900">Mentora</h1>
      <p className="mt-2 text-slate-600">Where AI Meets Education</p>

      {/* Real loader animation */}
      <div className="mt-8 flex gap-2">
        <div className="h-4 w-4 rounded-full bg-gray-500 animate-bounce" />
        <div className="h-4 w-4 rounded-full bg-gray-500 animate-bounce delay-200" />
        <div className="h-4 w-4 rounded-full bg-gray-500 animate-bounce delay-400" />
      </div>
    </main>
  );
}
