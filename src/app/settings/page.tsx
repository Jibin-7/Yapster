"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, Save, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || "");
      // Fetch user profile to get bio, interests, name, and image from DB directly 
      // (Session data doesn't update immediately without next-auth update session mechanism)
      fetch(`/api/users/${(session.user as any).id}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) setName(data.name);
          if (data.image) setImage(data.image);
          if (data.bio !== undefined) setBio(data.bio);
          if (data.bio !== undefined) setBio(data.bio);
        })
        .catch(err => console.error(err));
    }
  }, [status, router, session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/users/${(session.user as any).id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, image }),
      });

      if (res.ok) {
        setMessage("Profile updated successfully!");
        // Refresh session
        router.refresh();
      } else {
        setMessage("Failed to update profile.");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user) return;
    
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? This action cannot be undone and will delete all your posts and comments."
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${(session.user as any).id}/settings`, {
        method: "DELETE",
      });

      if (res.ok) {
        await signOut({ callbackUrl: "/login" });
      } else {
        alert("Failed to delete account.");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while deleting account.");
      setIsDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discordPrimary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your Yapster profile and account preferences.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#313338] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e1f22] overflow-hidden mb-8"
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <UserIcon className="text-discordPrimary" size={24} /> Edit Profile
          </h2>
          
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-instaGradientStart to-instaGradientBlue p-1 flex-shrink-0">
                <img 
                  src={image || `https://ui-avatars.com/api/?name=${name}&background=random`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full border-2 border-white dark:border-[#313338] object-cover"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Avatar URL</label>
                <input 
                  type="text" 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-[#1e1f22] text-gray-900 dark:text-white p-3 rounded-lg border-none focus:ring-2 focus:ring-discordPrimary transition-all"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Display Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#1e1f22] text-gray-900 dark:text-white p-3 rounded-lg border-none focus:ring-2 focus:ring-discordPrimary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#1e1f22] text-gray-900 dark:text-white p-3 rounded-lg border-none focus:ring-2 focus:ring-discordPrimary transition-all resize-none"
                rows={4}
                placeholder="Tell us a little bit about yourself..."
              />
            </div>



            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-[#1e1f22]">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-discordPrimary hover:bg-discordPrimary/90 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#313338] rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-2">Danger Zone</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Permanently delete your account and all of your content. This action is irreversible.
          </p>
          
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} /> {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
