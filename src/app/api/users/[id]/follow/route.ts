import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const targetUserId = id;
    const currentUserId = session.user.id;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ message: "Cannot follow yourself" }, { status: 400 });
    }

    await connectToDatabase();
    
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);
    
    if (!targetUser || !currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isFollowing = currentUser.following.includes(targetUserId as any);
    const hasRequested = targetUser.pendingFollowers.includes(currentUserId as any);

    let message = "";
    let state = "";

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter((id: any) => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter((id: any) => id.toString() !== currentUserId);
      message = "Unfollowed";
      state = "none";
    } else if (hasRequested) {
      // Cancel Request
      targetUser.pendingFollowers = targetUser.pendingFollowers.filter((id: any) => id.toString() !== currentUserId);
      message = "Request cancelled";
      state = "none";
    } else {
      // Send Request
      targetUser.pendingFollowers.push(currentUserId as any);
      message = "Follow requested";
      state = "requested";
    }

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({ 
      message,
      state
    });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
