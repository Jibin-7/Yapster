"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LogOut, User, Moon, Sun, Compass, MessageCircle, Home, Newspaper, Bell } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Active state checker
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm">
              <img src="/logo.png" alt="Yapster Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight hidden sm:block">
              Yapster
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Navigation Links */}
            {session?.user ? (
              <div className="hidden sm:flex items-center gap-4 mr-2">
                <Link href="/" className={`p-2.5 rounded-full transition-colors ${isActive('/') ? 'text-discordPrimary font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-discordDark'}`}>
                  <Home size={22} className={isActive('/') ? 'fill-current' : ''} />
                </Link>
                <Link href="/news" className={`p-2.5 rounded-full transition-colors ${isActive('/news') ? 'text-discordPrimary font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-discordDark'}`}>
                  <Newspaper size={22} className={isActive('/news') ? 'fill-current' : ''} />
                </Link>
                <Link href="/explore" className={`p-2.5 rounded-full transition-colors ${isActive('/explore') ? 'text-discordPrimary font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-discordDark'}`}>
                  <Compass size={22} className={isActive('/explore') ? 'fill-current' : ''} />
                </Link>
                <Link href="/messages" className={`p-2.5 rounded-full transition-colors ${pathname.startsWith('/messages') ? 'text-discordPrimary font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-discordDark'}`}>
                  <MessageCircle size={22} className={pathname.startsWith('/messages') ? 'fill-current' : ''} />
                </Link>
                <Link href="/notifications" className={`p-2.5 rounded-full transition-colors ${pathname.startsWith('/notifications') ? 'text-discordPrimary font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-discordDark'}`}>
                  <Bell size={22} className={pathname.startsWith('/notifications') ? 'fill-current' : ''} />
                </Link>
                <Link href={`/profile/${(session.user as any)?.id}`} className={`p-2.5 rounded-full transition-colors ${pathname.startsWith('/profile') ? 'text-discordPrimary font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-discordDark'}`}>
                  <User size={22} className={pathname.startsWith('/profile') ? 'fill-current' : ''} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 mr-2 sm:mr-4">
                <Link href="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Log In
                </Link>
                <Link href="/register" className="px-4 py-2 rounded-full bg-discordPrimary text-white text-sm font-bold hover:bg-discordPrimary/90 transition-colors">
                  Sign Up
                </Link>
              </div>
            )}

            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1"></div>
            
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {session?.user && (
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })} 
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      {session?.user && (
        <div className="sm:hidden fixed bottom-0 w-full z-50 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            <Link href="/" className={`p-3 rounded-2xl transition-all ${isActive('/') ? 'text-discordPrimary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
              <Home size={24} className={isActive('/') ? 'fill-current' : ''} />
            </Link>
            <Link href="/explore" className={`p-3 rounded-2xl transition-all ${isActive('/explore') ? 'text-discordPrimary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
              <Compass size={24} className={isActive('/explore') ? 'fill-current' : ''} />
            </Link>
            <Link href="/messages" className={`p-3 rounded-2xl transition-all ${pathname.startsWith('/messages') ? 'text-discordPrimary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
              <MessageCircle size={24} className={pathname.startsWith('/messages') ? 'fill-current' : ''} />
            </Link>
            <Link href="/notifications" className={`p-3 rounded-2xl transition-all ${pathname.startsWith('/notifications') ? 'text-discordPrimary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
              <Bell size={24} className={pathname.startsWith('/notifications') ? 'fill-current' : ''} />
            </Link>
            <Link href={`/profile/${(session.user as any)?.id}`} className={`p-3 rounded-2xl transition-all ${pathname.startsWith('/profile') ? 'text-discordPrimary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
              <User size={24} className={pathname.startsWith('/profile') ? 'fill-current' : ''} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
