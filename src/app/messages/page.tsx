"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, User, Search, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchConversations();
    }
  }, [status, router]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discordPrimary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100dvh-120px)] sm:h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white dark:bg-black overflow-hidden sm:border-x border-gray-100 dark:border-white/5">
      
      {/* Sidebar - Always visible on index */}
      <div className="flex w-full md:w-80 lg:w-96 bg-white dark:bg-black flex-col border-r border-gray-100 dark:border-white/5">
        <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-2xl sticky top-0 z-10 flex items-center gap-3">
          <h2 className="font-extrabold text-xl text-gray-900 dark:text-white">Messages</h2>
        </div>
        
        <div className="p-3 border-b border-gray-100 dark:border-discordDark">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search direct messages" 
              className="w-full bg-white dark:bg-discordDarker text-gray-900 dark:text-white text-[15px] px-10 py-3 rounded-full border border-gray-200 dark:border-discordDark focus:outline-none focus:border-discordPrimary transition-colors shadow-sm"
            />
            <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <AnimatePresence>
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Welcome to your inbox!
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Drop a line, share Yaps, and more with private conversations.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const avatarUrl = conv.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user.name)}&background=random`;
                return (
                  <motion.div
                    key={conv.user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-100 dark:border-discordDark/50 last:border-none"
                  >
                    <Link 
                      href={`/messages/${conv.user._id}`}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-discordDarker/50 transition-colors group relative"
                    >
                      {/* Active Indicator Line if unread */}
                      {conv.unread > 0 && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-discordPrimary"></div>
                      )}
                      
                      <div className="relative flex-shrink-0">
                        <img 
                          src={avatarUrl} 
                          alt={conv.user.name} 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-discordDark"
                        />
                        {conv.unread > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-discordPrimary rounded-full border-2 border-white dark:border-discordDarkest flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            {conv.unread > 99 ? '99+' : conv.unread}
                          </div>
                        )}
                      </div>
                      
                      <div className="overflow-hidden flex-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className={`font-bold text-[15px] truncate ${conv.unread > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                            {conv.user.name}
                          </h4>
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">
                            {/* Assuming conv has a timestamp, fallback to empty for now */}
                          </span>
                        </div>
                        <p className={`text-[14px] truncate ${conv.unread > 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          {conv.lastMessage.sender === session?.user?.id ? 'You: ' : ''}
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area - Empty State */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white dark:bg-discordDarkest relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-discordPrimary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="text-center max-w-sm relative z-10 p-6">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Select a message</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
            Choose from your existing conversations, or start a new one to connect with others.
          </p>
          <Link href="/" className="inline-block px-8 py-3.5 rounded-full bg-discordPrimary text-white font-bold hover:bg-discordPrimary/90 transition-colors shadow-lg shadow-discordPrimary/20">
            Find people
          </Link>
        </div>
      </div>
    </div>
  );
}
