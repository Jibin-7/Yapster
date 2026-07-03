"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit2, Trash2, Send, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PostCard({ post, session, onLike, onDelete, onEdit }: any) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showLikers, setShowLikers] = useState(false);
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const hasLiked = session && post.likes.some((u: any) => u._id === session.user.id || u === session.user.id);
  const isAuthor = session && post.author._id === session.user.id;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;
    
    setIsAddingComment(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post on Yapster",
          url: url,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        onEdit(post._id, editContent);
        setIsEditing(false);
        setShowMenu(false);
      }
    } catch (error) {
      console.error("Failed to edit post", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(post._id);
      }
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  const handlePressStart = (e: any) => {
    e.preventDefault();
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (post.likes.length > 0) {
        setShowLikers(true);
      }
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <motion.article 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-gray-100 dark:border-white/5 py-4 px-4 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={(e) => {
        // Prevent common-ancestor click bubbling bugs when modals open between press and release
        if (showLikers || showMenu || isEditing) return;
        
        // Only navigate if we're not clicking on interactive elements
        const target = e.target as HTMLElement;
        if (
          !target.closest('button') && 
          !target.closest('a') && 
          !target.closest('input') &&
          !target.closest('.interaction-bar') &&
          !target.closest('.modal-container')
        ) {
          window.location.href = `/post/${post._id}`;
        }
      }}
    >
      <div className="flex gap-4">
        {/* Avatar Column */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <Link href={`/profile/${post.author._id}`} className="block relative z-10 hover:opacity-80 transition-opacity">
            <img 
              src={post.author.image || `https://ui-avatars.com/api/?name=${post.author.name}&background=random`} 
              alt={post.author.name} 
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover"
            />
          </Link>
          {/* Thread Line - only show if there are comments to imply threading */}
          {comments.length > 0 && !showComments && (
            <div className="w-0.5 h-full bg-gray-200 dark:bg-discordDark mt-2 rounded-full"></div>
          )}
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0 pb-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profile/${post.author._id}`} className="font-bold text-gray-900 dark:text-white hover:underline truncate max-w-[200px] sm:max-w-none">
                {post.author.name}
              </Link>
              {post.visibility === 'private' && (
                <span title="Followers Only" className="flex items-center">
                  <Lock size={12} className="text-discordPrimary" />
                </span>
              )}
              <span className="text-gray-500 text-sm">·</span>
              <span className="text-gray-500 text-sm hover:underline cursor-pointer">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {isAuthor && (
              <div className="relative -mt-1 -mr-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
                  className="p-2 rounded-full hover:bg-discordLight dark:hover:bg-discordDarker text-gray-500 transition-colors"
                >
                  <MoreHorizontal size={18} />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-1 w-36 bg-white dark:bg-black rounded-xl shadow-xl border border-gray-200 dark:border-discordDark overflow-hidden z-20"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-discordDarker flex items-center gap-2 text-gray-900 dark:text-white transition-colors"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Body */}
          {isEditing ? (
            <div className="mb-3 space-y-3 pr-4" onClick={e => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-transparent text-gray-900 dark:text-white border border-gray-300 dark:border-discordDark focus:border-discordPrimary focus:ring-1 focus:ring-discordPrimary outline-none resize-none transition-all"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                  className="px-4 py-1.5 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-discordDark transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-full font-bold bg-gray-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-normal text-[15px] sm:text-base mb-3 pr-2">
              {post.content}
            </p>
          )}

          {post.imageUrl && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-discordDark">
              <img src={post.imageUrl} alt="Post content" className="w-full max-h-[400px] object-cover" />
            </div>
          )}

          {/* Interaction Bar */}
          <div className="interaction-bar flex items-center justify-between max-w-md text-gray-500 mt-1" onClick={e => e.stopPropagation()}>
            {/* Comment Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
              className="flex items-center gap-1.5 group transition-colors hover:text-discordPrimary"
            >
              <div className="p-2 -ml-2 rounded-full group-hover:bg-discordPrimary/10 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm font-medium">{comments.length > 0 ? comments.length : ''}</span>
            </button>

            {/* Like Button */}
            <div className="flex items-center gap-1.5 relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (pressTimer.current) {
                    clearTimeout(pressTimer.current);
                    pressTimer.current = null;
                  }
                  if (!isLongPress.current) {
                    onLike(post._id);
                  }
                  isLongPress.current = false;
                }}
                onPointerDown={handlePressStart}
                onPointerUp={handlePressEnd}
                onPointerLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                className={`flex items-center gap-1.5 group transition-colors ${hasLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'}`}
                title="Click to like, Long press to see who liked"
              >
                <div className={`p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors`}>
                  <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
                </div>
              </button>
              {post.likes.length > 0 && (
                <span 
                  className={`text-sm font-medium cursor-pointer ${hasLiked ? 'text-[#f91880]' : 'hover:text-gray-900 dark:hover:text-gray-300'}`}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={handlePressStart}
                  onPointerUp={handlePressEnd}
                  onPointerLeave={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                  title="Long press to see likers"
                >
                  {post.likes.length}
                </span>
              )}
            </div>

            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 group transition-colors hover:text-[#00ba7c]"
            >
              <div className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
                <Share2 size={18} />
              </div>
            </button>
          </div>

          {/* Comments Section (Thread Style) */}
          <AnimatePresence>
            {showComments && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Existing Comments */}
                {comments.length > 0 && (
                  <div className="mb-4 space-y-4">
                    {comments.map((comment: any) => (
                      <div key={comment._id} className="flex gap-3">
                        <Link href={`/profile/${comment.user._id}`} className="flex-shrink-0">
                          <img 
                            src={comment.user.image || `https://ui-avatars.com/api/?name=${comment.user.name}&background=random`} 
                            alt={comment.user.name} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover hover:opacity-80"
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/profile/${comment.user._id}`} className="font-bold text-sm text-gray-900 dark:text-white hover:underline">
                              {comment.user.name}
                            </Link>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 text-[15px]">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment Input */}
                {session && (
                  <form onSubmit={handleAddComment} className="flex gap-3 mt-2">
                    <img 
                      src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=random`} 
                      alt="Avatar" 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Post your reply"
                        className="flex-1 bg-transparent text-gray-900 dark:text-white text-[15px] border-b border-gray-300 dark:border-discordDark focus:border-discordPrimary outline-none pb-1 transition-colors"
                      />
                      <button 
                        type="submit" 
                        disabled={isAddingComment || !newComment.trim()}
                        className="px-4 py-1.5 rounded-full font-bold text-sm bg-discordPrimary text-white hover:bg-discordPrimary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Likers Modal */}
      <AnimatePresence>
        {showLikers && (
          <div className="modal-container fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-discordDarker w-full max-w-xs rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-discordDark"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-discordDark">
                <h3 className="font-bold text-gray-900 dark:text-white">Liked by</h3>
                <button onClick={() => setShowLikers(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-discordDark transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                {post.likes.map((user: any) => (
                  <Link 
                    key={user._id} 
                    href={`/profile/${user._id}`}
                    onClick={() => setShowLikers(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-discordDark transition-colors"
                  >
                    <img 
                      src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                      alt={user.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-bold text-gray-900 dark:text-white">{user.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
