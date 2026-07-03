"use client";

import { useState, useEffect } from "react";
import { Search, X, Users } from "lucide-react";
import Link from "next/link";

export default function NetworkStats({ 
  targetUserId, 
  initialFollowersCount, 
  initialFollowingCount 
}: { 
  targetUserId: string, 
  initialFollowersCount: number, 
  initialFollowingCount: number 
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const openModal = (tab: "followers" | "following") => {
    setActiveTab(tab);
    setModalOpen(true);
    fetchNetworkData();
  };

  const fetchNetworkData = async () => {
    if (followers.length > 0 || following.length > 0) return; // Already fetched
    
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/network`);
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers || []);
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === "followers" ? followers : following;
  const filteredList = currentList.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <div className="flex items-center gap-6">
        <button 
          onClick={() => openModal("following")} 
          className="text-gray-500 hover:text-discordPrimary transition-colors"
        >
          <span className="font-extrabold text-gray-900 dark:text-white mr-1.5">{initialFollowingCount}</span>Following
        </button>
        <button 
          onClick={() => openModal("followers")} 
          className="text-gray-500 hover:text-discordPrimary transition-colors"
        >
          <span className="font-extrabold text-gray-900 dark:text-white mr-1.5">{initialFollowersCount}</span>Followers
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-discordDarker w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-discordDark">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab("followers")}
                  className={`font-bold pb-1 ${activeTab === 'followers' ? 'text-discordPrimary border-b-2 border-discordPrimary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Followers
                </button>
                <button 
                  onClick={() => setActiveTab("following")}
                  className={`font-bold pb-1 ${activeTab === 'following' ? 'text-discordPrimary border-b-2 border-discordPrimary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Following
                </button>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-discordDark transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-gray-100 dark:border-discordDark">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-discordDark py-2 pl-10 pr-4 rounded-full text-sm outline-none text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-8 h-8 border-4 border-discordPrimary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredList.length > 0 ? (
                <div className="space-y-1">
                  {filteredList.map((user) => (
                    <Link 
                      key={user._id} 
                      href={`/profile/${user._id}`} 
                      onClick={() => setModalOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-discordDark transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                          alt={user.name} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:underline">{user.name}</p>
                          <p className="text-gray-500 text-xs">@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? "No users found" : `No ${activeTab} yet`}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
