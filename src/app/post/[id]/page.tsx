"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PostCard from "@/app/components/PostCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPost();
    }
  }, [status, router, id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) {
        if (res.status === 404) setError("Post not found");
        else setError("Failed to load post");
        return;
      }
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error(err);
      setError("An error occurred while loading the post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPost({ ...post, likes: data.likes });
      }
    } catch (error) {
      console.error("Failed to like post", error);
    }
  };

  const handleDeletePost = (postId: string) => {
    router.push("/");
  };

  const handleEditPost = (postId: string, newContent: string) => {
    setPost({ ...post, content: newContent });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-64 bg-gray-200 dark:bg-discordDarker rounded-2xl w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error}</h2>
        <Link href="/" className="text-discordPrimary hover:underline inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-screen border-x border-gray-100 dark:border-discordDark bg-white dark:bg-discordDarkest">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-discordDark flex items-center gap-6">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-discordDarker transition-colors cursor-pointer">
          <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
        </button>
        <h2 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">Post</h2>
      </div>
      
      {post && (
        <PostCard 
          post={post} 
          session={session} 
          onLike={handleLike} 
          onDelete={handleDeletePost}
          onEdit={handleEditPost}
        />
      )}
    </div>
  );
}
