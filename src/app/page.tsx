"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Globe, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import PostCard from "./components/PostCard";

type Post = {
  _id: string;
  content: string;
  imageUrl?: string;
  author: {
    _id: string;
    name: string;
    image?: string;
  };
  likes: string[];
  comments: any[];
  createdAt: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [visibility, setVisibility] = useState("public");
  
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref, inView } = useInView();

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPosts(1, true);
    }
  }, [status, router]);

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      setPage(prev => {
        const nextPage = prev + 1;
        fetchPosts(nextPage, false);
        return nextPage;
      });
    }
  }, [inView, hasMore, loading, loadingMore]);

  const fetchPosts = async (pageNum: number, isInitial: boolean) => {
    if (!isInitial) setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      const data = await res.json();
      if (Array.isArray(data)) {
        if (isInitial) {
          setPosts(data);
        } else {
          setPosts(prev => [...prev, ...data]);
        }
        if (data.length < 10) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      if (isInitial) setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Yapster');
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kpeihcmr'}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Cloudinary error response:", errorText);
      throw new Error("Image upload failed: " + errorText);
    }
    const data = await res.json();
    return data.secure_url;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !imageFile) return;

    setPosting(true);
    let finalImageUrl = "";
    
    try {
      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadToCloudinary(imageFile);
        setUploadingImage(false);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent, imageUrl: finalImageUrl, visibility }),
      });

      if (res.ok) {
        const post = await res.json();
        setPosts([post, ...posts]);
        setNewPostContent("");
        removeImage();
      }
    } catch (error) {
      console.error("Failed to create post", error);
      alert("Failed to create post. If image upload failed, check your Cloudinary keys.");
      setUploadingImage(false);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(post => {
          if (post._id === postId) {
            return { ...post, likes: data.likes };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error("Failed to like post", error);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleEditPost = (postId: string, newContent: string) => {
    setPosts(posts.map(p => {
      if (p._id === postId) {
        return { ...p, content: newContent };
      }
      return p;
    }));
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-discordDarker rounded-2xl w-full"></div>
        <div className="h-64 bg-gray-200 dark:bg-discordDarker rounded-2xl w-full"></div>
        <div className="h-64 bg-gray-200 dark:bg-discordDarker rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-[100dvh] sm:border-x border-gray-100 dark:border-white/5 bg-white dark:bg-black">
      
      {/* Header (Mobile) */}
      <div className="sm:hidden px-4 py-3 border-b border-gray-100 dark:border-white/5 backdrop-blur-2xl bg-white/80 dark:bg-black/80 sticky top-[56px] z-40">
        <h1 className="font-extrabold text-xl text-gray-900 dark:text-white">Home</h1>
      </div>

      {session && (
        <form onSubmit={handleCreatePost} className="border-b border-gray-100 dark:border-white/5 flex gap-4 px-4 py-5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
          <div className="flex-shrink-0">
            <img 
              src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=random`} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover" 
            />
          </div>
          <div className="flex-1 flex flex-col pt-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What is happening?!"
              className="w-full bg-transparent text-gray-900 dark:text-white text-[17px] resize-none outline-none placeholder-gray-500 font-medium"
              rows={Math.max(1, newPostContent.split('\n').length)}
              style={{ minHeight: '40px' }}
            />
            
            {imagePreview && (
              <div className="relative mt-2 mb-2 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
                <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
                <button 
                  type="button" 
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-3 border-t border-gray-100 dark:border-white/5 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
                  className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full hover:bg-discordPrimary/10 transition-colors text-discordPrimary"
                >
                  {visibility === 'public' ? (
                    <><Globe size={16} /> Public</>
                  ) : (
                    <><Lock size={16} /> Followers Only</>
                  )}
                </button>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-discordPrimary hover:bg-discordPrimary/10 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </button>
              </div>

              <button 
                type="submit" 
                disabled={posting || uploadingImage || (!newPostContent.trim() && !imageFile)} 
                className="px-5 py-1.5 rounded-full bg-discordPrimary text-white font-bold text-[15px] hover:bg-discordPrimary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploadingImage ? "Uploading..." : posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="pb-10">
        <AnimatePresence>
          {posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              session={session} 
              onLike={handleLike} 
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          ))}
        </AnimatePresence>

        {hasMore && !loading && (
          <div ref={ref} className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-discordPrimary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="py-8 text-center text-gray-500 text-sm font-medium">
            You've caught up!
          </div>
        )}

        {posts.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-4"
          >
            <div className="max-w-sm mx-auto">
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Welcome to Yapster</h3>
              <p className="text-gray-500 mb-6">
                This is the best place to see what's happening in your world. Find some people to follow now.
              </p>
              <button className="px-8 py-3 rounded-full bg-discordPrimary text-white font-bold hover:bg-discordPrimary/90 transition-colors">
                Let's go!
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
