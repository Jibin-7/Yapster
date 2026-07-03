"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Hash, Phone, Video, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { userId } = use(params);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && userId) {
      fetchMessages();
      fetchOtherUser();
    }
  }, [status, userId]);

  useEffect(() => {
    if (!session?.user?.id || !userId) return;
    
    // Import Pusher dynamically on client side
    const initPusher = async () => {
      const Pusher = (await import('pusher-js')).default;
      const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || 'bcff5f384949b336e304', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      });

      const channelName = [session.user.id, userId].sort().join('-');
      const channel = pusherClient.subscribe(channelName);

      channel.bind('new-message', (newMessage: any) => {
        setMessages((prev) => {
          // Avoid duplicate messages if we are the sender and already added it
          if (prev.some(m => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      });

      return () => {
        pusherClient.unsubscribe(channelName);
      };
    };

    const cleanup = initPusher();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [session?.user?.id, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchOtherUser = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        setOtherUser(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/messages/${userId}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const sentMessage = await res.json();
        setMessages([...messages, sentMessage]);
        setNewMessage("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
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
      
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex w-80 lg:w-96 bg-white dark:bg-black flex-col border-r border-gray-100 dark:border-white/5">
        <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-2xl sticky top-0 flex items-center gap-3 z-10">
          <Link href="/messages" className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-discordDarker text-gray-500 transition-colors">
            <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
          </Link>
          <span className="font-extrabold text-xl text-gray-900 dark:text-white">Messages</span>
        </div>
        
        {/* Simplified sidebar for context */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          {otherUser ? (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <img 
                  src={otherUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || 'User')}&background=random`} 
                  alt={otherUser.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover shadow-lg border-2 border-white dark:border-discordDarker"
                />
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-discordDarkest rounded-full"></div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-xl">{otherUser.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 mt-1 font-medium">@{otherUser.name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
              <Link href={`/profile/${otherUser._id}`} className="px-6 py-2.5 bg-gray-200 dark:bg-discordDarker hover:bg-gray-300 dark:hover:bg-discordDark text-gray-900 dark:text-white text-[15px] font-bold rounded-full transition-colors inline-block shadow-sm">
                View Profile
              </Link>
            </div>
          ) : (
            <div className="text-center opacity-50">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 dark:bg-discordDarker rounded-full animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-discordDarker rounded animate-pulse mx-auto mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-discordDarker rounded animate-pulse mx-auto"></div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-black relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-100 dark:border-white/5 px-4 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-2xl z-20">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-discordDarker text-gray-500 transition-colors">
              <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
            </Link>
            <div className="flex items-center gap-3">
              {otherUser && (
                <img 
                  src={otherUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || 'User')}&background=random`} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover block md:hidden"
                />
              )}
              <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">
                {otherUser?.name || 'Loading...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            {/* Icons removed as per request */}
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-1 z-10">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-24 h-24 mb-6 relative">
                <img 
                  src={otherUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=random`} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover shadow-lg" 
                />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                Say hi to {otherUser?.name}!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                This is the beginning of your direct message history with <strong className="text-gray-900 dark:text-gray-200">@{otherUser?.name?.toLowerCase().replace(/\s+/g, '')}</strong>.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = session?.user?.id === msg.sender;
              const showAvatar = idx === 0 || messages[idx - 1].sender !== msg.sender;

              if (isMe) {
                // Sent message
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    key={msg._id} 
                    className={`flex justify-end ${showAvatar ? 'mt-4' : 'mt-1'}`}
                  >
                    <div className="bg-discordPrimary text-white px-5 py-3 rounded-[20px] rounded-br-[4px] max-w-[75%] sm:max-w-[65%] shadow-sm text-[15px] font-medium leading-relaxed break-words">
                      {msg.content}
                    </div>
                  </motion.div>
                );
              } else {
                // Received message
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    key={msg._id} 
                    className={`flex gap-3 ${showAvatar ? 'mt-4' : 'mt-1'}`}
                  >
                    <div className="w-10 flex-shrink-0 flex items-end pb-1">
                      {showAvatar && (
                        <img 
                          src={otherUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=random`} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 shadow-sm border border-gray-100 dark:border-discordDark"
                        />
                      )}
                    </div>
                    <div className="bg-gray-100 dark:bg-discordDarker text-gray-900 dark:text-white px-5 py-3 rounded-[20px] rounded-bl-[4px] max-w-[75%] sm:max-w-[65%] shadow-sm text-[15px] font-medium leading-relaxed break-words border border-gray-200 dark:border-discordDark">
                      {msg.content}
                    </div>
                  </motion.div>
                );
              }
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-black border-t border-gray-100 dark:border-white/5 z-20">
          <form onSubmit={handleSendMessage} className="relative flex items-center bg-gray-50 dark:bg-white/[0.05] rounded-full overflow-hidden border border-gray-100 dark:border-white/5">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message @${otherUser?.name?.toLowerCase().replace(/\s+/g, '') || '...'}`}
              className="w-full bg-transparent text-gray-900 dark:text-white px-6 py-3.5 pr-14 outline-none placeholder-gray-500 font-medium text-[15px]"
            />
            <button 
              type="submit" 
              disabled={sending || !newMessage.trim()}
              className="absolute right-2 p-2 rounded-full bg-discordPrimary text-white hover:bg-discordPrimary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send size={18} className={sending ? "animate-pulse" : "ml-0.5 mt-0.5"} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
