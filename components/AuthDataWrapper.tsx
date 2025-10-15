"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseClient";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import LoadingScreen from "@/components/LoadingScreen";

interface AuthDataWrapperProps {
  children: ReactNode;
}

export default function AuthDataWrapper({ children }: AuthDataWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } catch (err) {
        console.error("Error fetching user data:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <LoadingScreen />;

  // Pass userData to children if needed
  return <>{children}</>;
}
