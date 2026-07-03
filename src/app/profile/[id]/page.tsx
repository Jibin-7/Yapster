import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import Post from "@/lib/models/Post";
import { notFound } from "next/navigation";
import FollowButton from "./FollowButton";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import NetworkStats from "./NetworkStats";

export default async function ProfilePage(
  props: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const activeTab = searchParams?.tab || "posts";
  
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  let profileUser = null;
  try {
    profileUser = await User.findById(id).lean();
  } catch (error) {
    // Likely a CastError
  }

  if (!profileUser) {
    notFound();
  }

  let currentUserInfo = null;
  if (currentUserId) {
    currentUserInfo = await User.findById(currentUserId).lean();
  }
  const followingIds = currentUserInfo?.following || [];

  const visibilityFilter = currentUserId ? {
    $or: [
      { visibility: { $ne: 'private' } },
      { visibility: 'private', author: currentUserId },
      { visibility: 'private', author: { $in: followingIds } }
    ]
  } : { visibility: { $ne: 'private' } };

  const postCount = await Post.countDocuments({ author: id });

  // Fetch posts based on active tab
  let displayedPosts = [];
  if (activeTab === "replies") {
    displayedPosts = await Post.find({ "comments.author": id, ...visibilityFilter } as any).sort({ createdAt: -1 }).lean();
  } else if (activeTab === "likes") {
    displayedPosts = await Post.find({ likes: id, ...visibilityFilter } as any).sort({ createdAt: -1 }).lean();
  } else {
    displayedPosts = await Post.find({ author: id, ...visibilityFilter } as any).sort({ createdAt: -1 }).lean();
  }

  const isOwnProfile = currentUserId === id;
  const isFollowing = currentUserId 
    ? (profileUser.followers || []).map((id: any) => id.toString()).includes(currentUserId)
    : false;
  
  const hasRequested = currentUserId
    ? (profileUser.pendingFollowers || []).map((id: any) => id.toString()).includes(currentUserId)
    : false;

  let followState = 'none';
  if (isFollowing) followState = 'following';
  else if (hasRequested) followState = 'requested';

  const avatarUrl = profileUser.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profileUser.name) + "&background=random";

  return (
    <div className="max-w-xl mx-auto min-h-[100dvh] sm:border-x border-gray-100 dark:border-white/5 bg-white dark:bg-black">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-2xl sticky top-[56px] sm:top-0 z-40 flex flex-col justify-center">
        <div className="flex items-center gap-6">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-discordDarker transition-colors cursor-pointer backdrop-blur-md bg-white/50 dark:bg-black/50">
          <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
        </Link>
        <div>
          <h2 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">{profileUser.name}</h2>
          <p className="text-sm text-gray-500 font-medium">{postCount} posts</p>
        </div>
        </div>
      </div>

      {/* Dynamic Blurred Cover Photo */}
      <div className="relative h-40 sm:h-56 w-full overflow-hidden bg-discordDarker">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-60 scale-150 transform"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-discordDarkest to-transparent opacity-80" />
      </div>

      {/* Profile Info - Center Aligned ID Card Style */}
      <div className="px-4 pb-6 relative flex flex-col items-center text-center -mt-20">
        
        {/* Avatar */}
        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-white dark:border-discordDarkest bg-black relative shadow-xl mb-4 z-10">
          <img 
            src={avatarUrl} 
            alt={profileUser.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full rounded-full object-cover" 
          />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-24 right-4 z-20">
          {isOwnProfile ? (
            <Link href="/settings" className="px-5 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-discordDark text-gray-900 dark:text-white font-bold text-sm sm:text-[15px] transition-colors shadow-sm backdrop-blur-md bg-white/80 dark:bg-black/80">
              Edit profile
            </Link>
          ) : (
            currentUserId && (
              <div className="flex items-center gap-2">
                <Link href={`/messages/${id}`} className="p-2.5 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-discordDark text-gray-900 dark:text-white transition-colors shadow-sm backdrop-blur-md bg-white/80 dark:bg-black/80">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></g></svg>
                </Link>
                <div className="shadow-sm">
                  <FollowButton targetUserId={id} initialFollowState={followState} />
                </div>
              </div>
            )
          )}
        </div>

        {/* Name & Handle */}
        <div className="mt-2 mb-4 w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{profileUser.name}</h1>
          <p className="text-gray-500 font-medium mt-0.5">@{profileUser.name.toLowerCase().replace(/\s+/g, '')}</p>
        </div>

        {/* Bio */}
        <div className="mb-6 max-w-sm">
          <p className="text-[15px] text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {profileUser.bio || "No bio yet."}
          </p>
        </div>

        {/* Metadata & Stats */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-[15px] bg-gray-50/50 dark:bg-white/[0.02] px-6 py-4 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Calendar size={16} /> Joined July 2026
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
          
          <NetworkStats 
            targetUserId={id} 
            initialFollowersCount={profileUser.followers.length} 
            initialFollowingCount={profileUser.following.length} 
          />
        </div>
      </div>

      {/* Pill-shaped Tabs */}
      <div className="px-4 py-3 border-t border-b border-gray-100 dark:border-discordDark flex gap-2 overflow-x-auto no-scrollbar">
        <Link href="?tab=posts" className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap shadow-sm transition-colors ${activeTab === 'posts' ? 'bg-discordPrimary text-white hover:opacity-90' : 'bg-gray-100 dark:bg-discordDarker text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discordDark'}`}>
          Posts
        </Link>
        <Link href="?tab=replies" className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap shadow-sm transition-colors ${activeTab === 'replies' ? 'bg-discordPrimary text-white hover:opacity-90' : 'bg-gray-100 dark:bg-discordDarker text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discordDark'}`}>
          Replies
        </Link>
        <Link href="?tab=likes" className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap shadow-sm transition-colors ${activeTab === 'likes' ? 'bg-discordPrimary text-white hover:opacity-90' : 'bg-gray-100 dark:bg-discordDarker text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discordDark'}`}>
          Likes
        </Link>
      </div>

      {/* Post Grid */}
      {displayedPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1 bg-white dark:bg-discordDarkest">
          {displayedPosts.map((post: any) => (
            <Link key={post._id} href={`/post/${post._id}`} className="block group relative aspect-square bg-gray-100 dark:bg-discordDarker overflow-hidden">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="Post image" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full p-3 flex items-center justify-center text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-discordDarker dark:to-discordDark hover:from-gray-100 hover:to-gray-200 transition-colors">
                  <p className="text-gray-800 dark:text-gray-200 font-medium text-xs sm:text-sm line-clamp-4 leading-snug">{post.content}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4">
          <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-discordDarker rounded-full flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-10 h-10 fill-current text-gray-400"><g><path d="M12 1.696L.622 8.807l11.378 7.112 11.378-7.112L12 1.696zM1.464 9.992L12 16.57l10.536-6.578L12 17.585 1.464 9.992z"></path></g></svg>
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">No {activeTab} yet</h3>
          <p className="text-gray-500">
            When they interact, it will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
