"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Home, LogOut, Edit3, Save, X } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [gender, setGender] = useState("Male");

  // ✅ Check login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/login");
      else setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading)
    return (
      <main className="flex items-center justify-center min-h-dvh text-slate-600 bg-gradient-to-br from-gray-50 to-white">
        <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-indigo-500 rounded-full" />
        <span className="ml-3">Loading profile...</span>
      </main>
    );

  return (
    <main className="min-h-dvh flex bg-gradient-to-br from-white via-slate-50 to-indigo-50 text-slate-800">
      {/* --- LEFT SIDEBAR --- */}
      <aside className="hidden md:flex flex-col justify-between border-r border-slate-200 w-60 p-6 bg-white/80 backdrop-blur-xl shadow-lg">
        <div className="space-y-6">
          <h2 className="text-slate-500 font-semibold text-xs uppercase tracking-widest">
            Dashboard
          </h2>

          <nav className="space-y-3">
            <a
              href="/"
              className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition"
            >
              <Home size={18} />
              <span>Home</span>
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-slate-700 hover:text-red-600 transition"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </nav>
        </div>

        <p className="text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} Mentora
        </p>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <section className="flex-1 px-6 sm:px-10 py-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your personal details and preferences
            </p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              editing
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
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

        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm p-8 transition hover:shadow-md">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border border-slate-300 shadow-md">
              <Image
                src={user?.photoURL || "/user-avatar.jpg"}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {user?.displayName || "New User"}
              </h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <InputField
              label="Full Name"
              defaultValue={user?.displayName || ""}
              disabled={!editing}
            />
            <InputField label="Nick Name" placeholder="Your Nick Name" disabled={!editing} />
            <InputField label="Date of Birth" type="date" disabled={!editing} />
            <InputField
              label="Address"
              placeholder="No 4, Temple Road, Colombo 07."
              disabled={!editing}
            />

            {/* Mobile */}
            <div>
              <label className="block mb-1 text-slate-700 font-medium">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  disabled={!editing}
                  className="rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option>+94</option>
                  <option>+91</option>
                  <option>+44</option>
                </select>
                <input
                  type="text"
                  placeholder="76 786 578"
                  disabled={!editing}
                  className="flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block mb-1 text-slate-700 font-medium">
                Gender
              </label>
              <div className="flex items-center gap-4">
                {["Male", "Female"].map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-slate-600"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={opt}
                      checked={gender === opt}
                      onChange={() => setGender(opt)}
                      disabled={!editing}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </form>

          {/* Save Buttons */}
          {editing && (
            <div className="flex justify-end gap-3 mt-10">
              <button
                onClick={() => setEditing(false)}
                className="px-5 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button className="px-5 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// 🔹 Small Input Field Component
function InputField({
  label,
  type = "text",
  placeholder = "",
  defaultValue,
  disabled = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block mb-1 text-slate-700 font-medium">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`w-full rounded-md border border-slate-300 px-3 py-2 outline-none bg-slate-50 focus:ring-2 focus:ring-indigo-500 ${
          disabled ? "opacity-70 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}
