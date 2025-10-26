"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Home, LogOut, Edit3, Save, X, Camera, CreditCard } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseClient";
import { doc, setDoc, getDoc } from "firebase/firestore";
import LoadingScreen from "@/components/LoadingScreen";
import ProfileImageModal from "@/components/ProfileImageModal"; // ✅ new import

type Status = { type: "success" | "error" | null; message: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>({ type: null, message: "" });
  const [showImageModal, setShowImageModal] = useState(false); // ✅ new state

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    educationLevel: "",
    interests: "",
  });

  const pickInitialFullName = (displayName?: string | null) => displayName || "";

  // 🔹 Load Firebase Auth + Firestore profile
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

  // 🔹 Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // 🔹 Save profile data
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
    <main className="min-h-screen flex bg-white text-gray-800">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 p-6 bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-md z-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-xl font-extrabold text-black select-none">Mentora</span>
        </div>

        <nav className="flex flex-col gap-4">
          <a href="/dashboard" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 transition font-medium">
            <Home size={18} /> <span>Home</span>
          </a>
          <a href="/billing" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 transition font-medium">
            <CreditCard size={18} /> <span>Billing</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-gray-700 hover:text-red-600 transition font-medium"
          >
            <LogOut size={18} /> <span>Log Out</span>
          </button>
        </nav>

        {user && (
          <div className="absolute bottom-6 left-6 right-6 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3">
              <Image
                src={user.photoURL || "/user-avatar.png"}
                alt="User"
                width={40}
                height={40}
                className="rounded-full border border-gray-300"
              />
              <div className="truncate">
                <p className="text-sm font-medium text-gray-800 truncate">{formData.fullName || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main section */}
      <section className="flex-1 ml-60 w-full px-10 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your personal details and preferences</p>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              editing ? "bg-gray-900 text-white hover:bg-gray-700" : "bg-black text-white hover:bg-gray-800"
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

        {status.type && (
          <div
            className={`mb-6 p-3 rounded-md text-sm font-medium ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Profile section */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative h-20 w-20 sm:h-28 sm:w-28 rounded-full overflow-hidden border border-gray-300 shadow-md group">
              <Image
                src={user?.photoURL || "/user-avatar.png"}
                alt="Profile"
                fill
                className="object-cover"
              />
              <button
                onClick={() => setShowImageModal(true)}
                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full"
              >
                <Camera size={16} className="sm:hidden" />
                <Camera size={18} className="hidden sm:block" />
              </button>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{formData.fullName || user?.displayName || "New User"}</h2>
              <p className="text-xs sm:text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Form fields */}
          <form className="grid grid-cols-1 gap-4 sm:gap-6 text-sm">
            <InputField
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={!editing}
            />
            <TextareaField
              label="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!editing}
              placeholder="Tell us about yourself..."
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
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
              <button
                onClick={() => setEditing(false)}
                className="px-4 sm:px-5 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition text-sm sm:text-base w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 sm:px-5 py-2 rounded-full bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* ✅ Profile Image Modal */}
        {showImageModal && (
          <ProfileImageModal
            userId={user?.uid}
            onClose={() => setShowImageModal(false)}
            onImageSaved={(url) => {
              setUser((prev: any) => ({ ...prev, photoURL: url }));
              setShowImageModal(false);
            }}
          />
        )}
      </section>
    </main>
  );
}

/* ---------- Reusable Fields ---------- */
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
      <label className="block mb-1 text-gray-700 font-medium">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border border-gray-300 px-4 py-2 outline-none bg-gray-50 focus:ring-1 focus:ring-black ${
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
      <label className="block mb-1 text-gray-700 font-medium">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full h-28 rounded-xl border border-gray-300 px-4 py-2 outline-none bg-gray-50 focus:ring-1 focus:ring-black resize-none ${
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
      <label className="block mb-1 text-gray-700 font-medium">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border border-gray-300 px-4 py-2 bg-gray-50 focus:ring-1 focus:ring-black ${
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
