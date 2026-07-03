"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

export default function NotificationItem({ user }: { user: any }) {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/follow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user._id })
      });
      if (res.ok) {
        setStatus("accepted");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/follow-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user._id })
      });
      if (res.ok) {
        setStatus("declined");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "declined") {
    return null; // Hide declined requests
  }

  const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-discordDarker rounded-xl border border-gray-100 dark:border-discordDark transition-all">
      <Link href={`/profile/${user._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img 
          src={avatarUrl} 
          alt={user.name} 
          referrerPolicy="no-referrer"
          className="w-10 h-10 rounded-full object-cover shadow-sm"
        />
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-sm">{user.name}</p>
          <p className="text-gray-500 text-xs">Requested to follow you</p>
        </div>
      </Link>
      
      {status === "accepted" ? (
        <span className="text-green-500 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full flex items-center gap-1">
          <Check size={14} /> Accepted
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAccept}
            disabled={loading}
            className="p-2 rounded-full bg-discordPrimary text-white hover:bg-discordPrimary/90 transition-colors shadow-sm disabled:opacity-50"
            title="Accept"
          >
            <Check size={16} />
          </button>
          <button 
            onClick={handleDecline}
            disabled={loading}
            className="p-2 rounded-full bg-gray-200 dark:bg-discordDark text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Decline"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
