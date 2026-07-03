import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Post from "@/lib/models/Post";

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
    const postId = id;

    await connectToDatabase();
    
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const userId = session.user.id;
    // ObjectIds need to be compared as strings
    const hasLiked = post.likes.some((id: any) => id.toString() === userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id: any) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    
    // Populate likes to return to the client
    await post.populate('likes', 'name image');

    return NextResponse.json({ 
      message: hasLiked ? "Unliked post" : "Liked post", 
      hasLiked: !hasLiked,
      likes: post.likes
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
