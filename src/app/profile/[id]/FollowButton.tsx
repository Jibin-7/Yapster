"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Check, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FollowButton({ targetUserId, initialFollowState }: { targetUserId: string, initialFollowState: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [followState, setFollowState] = useState(initialFollowState); // 'none', 'requested', 'following'
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setFollowState(data.state);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleFollowToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm
        ${followState === 'following'
          ? "bg-gray-100 dark:bg-discordDark text-gray-800 dark:text-gray-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400" 
          : followState === 'requested'
          ? "bg-gray-100 dark:bg-discordDark text-gray-800 dark:text-gray-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          : "bg-discordPrimary text-white hover:bg-discordPrimary/90 hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
    >
      {followState === 'following' ? (
        <>
          <Check size={16} className="group-hover:hidden" />
          <UserMinus size={16} className="hidden group-hover:block" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:block">Unfollow</span>
        </>
      ) : followState === 'requested' ? (
        <>
          <Clock size={16} className="group-hover:hidden" />
          <UserMinus size={16} className="hidden group-hover:block" />
          <span className="group-hover:hidden">Requested</span>
          <span className="hidden group-hover:block">Cancel</span>
        </>
      ) : (
        <>
          <UserPlus size={16} />
          Follow
        </>
      )}
    </button>
  );
}
