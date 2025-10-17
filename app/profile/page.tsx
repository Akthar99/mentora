// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Home, LogOut, Edit3, Save, X } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseClient";
import { doc, setDoc, getDoc } from "firebase/firestore";
import LoadingScreen from "@/components/LoadingScreen";

type Status = { type: "success" | "error" | null; message: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>({ type: null, message: "" });

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    educationLevel: "",
    interests: "",
  });

  const pickInitialFullName = (displayName?: string | null) => displayName || "";

  // Load Firebase Auth + Firestore profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as any;

          // If missing name, copy from Google
          if ((!data.fullName || data.fullName.trim() === "") && currentUser.displayName) {
            const googleFullName = pickInitialFullName(currentUser.displayName);
            await setDoc(docRef, { fullName: googleFullName }, { merge: true });
            data.fullName = googleFullName;
          }

          setFormData({
            fullName: data.fullName || pickInitialFullName(currentUser.displayName),
            bio: data.bio || "",
            educationLevel: data.educationLevel || "",
            interests: data.interests || "",
          });
        } else {
          // New user -> create
          const initialFull = pickInitialFullName(currentUser.displayName);
          const initialData = {
            fullName: initialFull,
            bio: "",
            educationLevel: "",
            interests: "",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, initialData, { merge: true });
          setFormData(initialData);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Save handler (merge update)
  const handleSave = async () => {
    if (!user || !user.uid) {
      setStatus({ type: "error", message: "No user found. Please log in again." });
      return;
    }

    try {
      const cleanData = Object.fromEntries(
        Object.entries({
          ...formData,
          email: user.email || "",
          photoURL: user.photoURL || "",
          updatedAt: new Date().toISOString(),
        }).filter(([_, v]) => v !== undefined)
      );

      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, cleanData, { merge: true });

      setEditing(false);
      setStatus({ type: "success", message: "Profile saved successfully!" });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch (error: any) {
      console.error("❌ Error saving profile:", error);
      setStatus({
        type: "error",
        message: `❌ Failed to save profile: ${error.message || error}`,
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 4000);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <main className="min-h-screen flex bg-gradient-to-br from-white via-slate-50 to-indigo-50 text-slate-800">
      {/* Sidebar (fixed) */}
      <aside className="fixed left-0 top-0 h-full w-60 p-6 bg-white/90 backdrop-blur-md border-r border-slate-200 shadow-md z-20">
        {/* Brand (Mentora, black bold) */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-xl font-extrabold text-black select-none">Mentora</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-4">
          <a href="/dashboard" className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition font-medium">
            <Home size={18} /> <span>Home</span>
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-700 hover:text-red-600 transition font-medium"
            aria-label="Log out"
          >
            <LogOut size={18} /> <span>Log Out</span>
          </button>
        </nav>

        {/* Bottom mini-profile (kept at bottom) */}
        {user && (
          <div className="absolute bottom-6 left-6 right-6 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-3">
              <Image
                src={user.photoURL || "/user-avatar.png"}
                alt="User"
                width={40}
                height={40}
                className="rounded-full border border-slate-300"
              />
              <div className="truncate">
                <p className="text-sm font-medium text-slate-800 truncate">{formData.fullName || "User"}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content — shifted by sidebar width (ml-60) */}
      {/* We center content by wrapping everything in a container with mx-auto + max-w */}
      <section className="flex-1 ml-60 w-full">
        <div className="w-full max-w-3xl mx-auto px-8 sm:px-12 py-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your public profile & learning preferences</p>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                editing ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {editing ? (
                <>
                  <X size={16} /> Cancel
                </>
              ) : (
                <>
                  <Edit3 size={16} /> Edit
                </>
              )}
            </button>
          </div>

          {/* Status message */}
          {status.type && (
            <div
              className={`mb-6 p-3 rounded-md text-sm font-medium transition-all ${
                status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.message}
            </div>
          )}

          {/* Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm p-8 transition hover:shadow-md">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative h-24 w-24 rounded-full overflow-hidden border border-slate-300 shadow-md">
                <Image src={user?.photoURL || "/user-avatar.png"} alt="Profile" fill className="object-cover" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800">{formData.fullName || user?.displayName || "New User"}</h2>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            {/* Form */}
            <form className="grid grid-cols-1 gap-6 text-sm">
              <InputField
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={!editing}
              />

              <TextareaField
                label="Bio / About me"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                placeholder="Tell us who you are and what you learn..."
              />

              <SelectField
                label="Education Level"
                value={formData.educationLevel}
                onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                disabled={!editing}
              />

              <InputField
                label="Learning Interests"
                placeholder="e.g. AI, Web Dev, Math"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                disabled={!editing}
              />
            </form>

            {editing && (
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setEditing(false)}
                  className="px-5 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Reusable Fields (typed) ---------- */

type InputFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

function InputField({ label, type = "text", placeholder = "", value, onChange, disabled = false }: InputFieldProps) {
  return (
    <div>
      <label className="block mb-1 text-slate-700 font-medium">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-md border border-slate-300 px-3 py-2 outline-none bg-slate-50 focus:ring-2 focus:ring-indigo-500 ${
          disabled ? "opacity-70 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

type TextareaFieldProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
};

function TextareaField({ label, value, onChange, disabled = false, placeholder = "" }: TextareaFieldProps) {
  return (
    <div>
      <label className="block mb-1 text-slate-700 font-medium">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full h-28 rounded-md border border-slate-300 px-3 py-2 outline-none bg-slate-50 focus:ring-2 focus:ring-indigo-500 resize-none ${
          disabled ? "opacity-70 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
};

function SelectField({ label, value, onChange, disabled = false }: SelectFieldProps) {
  return (
    <div>
      <label className="block mb-1 text-slate-700 font-medium">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500 ${
          disabled ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        <option value="">Select your level</option>
        <option value="School">School</option>
        <option value="College">College</option>
        <option value="University">University</option>
        <option value="Professional">Professional</option>
      </select>
    </div>
  );
}
