"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Newspaper, Settings, ExternalLink, Clock, Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastArticleRef = useCallback((node: any) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchNews(activeQuery, 0, true);
    }
  }, [status, router]);

  useEffect(() => {
    if (page > 0) {
      fetchNews(activeQuery, page, false);
    }
  }, [page]);

  const fetchNews = async (query: string, pageNum: number, isInitial: boolean) => {
    if (isInitial) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const url = query 
        ? `/api/news?q=${encodeURIComponent(query)}&page=${pageNum}` 
        : `/api/news?page=${pageNum}`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        if (isInitial) {
          setArticles(data.articles || []);
        } else {
          // Append new articles avoiding duplicates by ID
          setArticles(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newArticles = (data.articles || []).filter((a: any) => !existingIds.has(a.id));
            return [...prev, ...newArticles];
          });
        }
        
        setActiveQuery(data.searchQuery || "");
        setHasMore(data.hasMore !== false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
      fetchNews(searchQuery.trim(), 0, true);
    } else {
      setActiveQuery("");
      fetchNews("", 0, true);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && articles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discordPrimary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-screen border-x border-gray-100 dark:border-discordDark bg-white dark:bg-discordDarkest">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-discordDark">
        <h1 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
          News
        </h1>
        {activeQuery && (
          <p className="text-gray-500 text-sm mt-0.5">
            Showing results for <span className="font-bold text-discordPrimary">"{activeQuery}"</span>
          </p>
        )}
      </div>

      <div className="px-4 py-3 border-b border-gray-100 dark:border-discordDark bg-gray-50/50 dark:bg-discordDarker/20">
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="Search breaking news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-black text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-discordDark focus:outline-none focus:border-discordPrimary transition-colors text-[15px]"
          />
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
        </form>
      </div>

      <div className="pb-10">
        <AnimatePresence>
          {articles.map((article, index) => {
            const isLast = index === articles.length - 1;
            
            return (
              <motion.article 
                key={article.id || index}
                ref={isLast ? lastArticleRef : null}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-gray-200 dark:border-discordDark py-4 px-4 hover:bg-gray-50/50 dark:hover:bg-discordDarker/50 transition-colors"
              >
                {article.category && (
                  <div className="mb-2">
                    <span className="text-discordPrimary text-xs font-bold uppercase tracking-wider">
                      {article.category}
                    </span>
                  </div>
                )}
                
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  <a href={article.url || "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {article.title}
                  </a>
                </h2>
                
                <p className="text-gray-800 dark:text-gray-300 text-[15px] leading-snug mb-3">
                  {article.description}
                </p>

                <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                  <span className="font-bold">{article.source?.name || "Global News"}</span>
                  <span>·</span>
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
      
      {loadingMore && (
        <div className="mt-8 flex justify-center">
          <Loader2 className="animate-spin text-discordPrimary" size={32} />
        </div>
      )}
    </div>
  );
}
