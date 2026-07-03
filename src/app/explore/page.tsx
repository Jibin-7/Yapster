"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FollowButton from "../profile/[id]/FollowButton";

type SearchUser = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  followers: string[];
};

export default function ExplorePage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="max-w-xl mx-auto min-h-screen border-x border-gray-100 dark:border-discordDark bg-white dark:bg-discordDarkest">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-discordDark">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Explore</h1>
      </div>

      <div className="px-4 py-3 border-b border-gray-100 dark:border-discordDark bg-gray-50/50 dark:bg-discordDarker/20">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-discordPrimary transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search Yapster..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white dark:bg-black text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-discordDark focus:outline-none focus:border-discordPrimary transition-colors text-[15px]"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discordPrimary"></div>
        </div>
      )}
      
      {!loading && query.trim() && results.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-discordDarker rounded-3xl border border-gray-100 dark:border-discordDark shadow-sm">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-discordDarkest rounded-full flex items-center justify-center mb-4">
            <User size={24} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No users found for "{query}".</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          <AnimatePresence>
            {results.map((user) => {
              const isFollowing = session ? user.followers.includes((session.user as any)?.id) : false;

              return (
                <motion.div 
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-discordDarker p-4 sm:p-5 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-discordDark shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-4">
                    <Link href={`/profile/${user._id}`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-instaGradientStart to-instaGradientBlue p-[2px] group-hover:scale-105 transition-transform">
                        <img 
                          src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                          alt={user.name} 
                          className="w-full h-full rounded-full border-2 border-white dark:border-discordDarker object-cover"
                        />
                      </div>
                    </Link>
                    <div>
                      <Link href={`/profile/${user._id}`} className="font-bold text-gray-900 dark:text-gray-100 text-[16px] hover:underline">
                        {user.name}
                      </Link>
                      {user.bio ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-[200px] sm:max-w-[300px]">{user.bio}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
                      )}
                    </div>
                  </div>
                  {session && (session.user as any)?.id !== user._id && (
                    <FollowButton targetUserId={user._id} initialFollowState={isFollowing ? 'following' : 'none'} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
