"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { useRouter } from "next/navigation";
import SplashScreen from "@/components/LoadingScreen";

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => setShowSplash(false), 2500); // splash duration
      if (user) router.push("/profile");
      else router.push("/login");
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <>
      {showSplash && <SplashScreen />}
      {!checkingAuth && (
        <main className="flex items-center justify-center min-h-screen">
          {/* Optional placeholder content while redirect happens */}
        </main>
      )}
    </>
  );
}
