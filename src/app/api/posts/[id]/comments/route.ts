import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Post from "@/lib/models/Post";
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

    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    const { id } = await params;
    const postId = id;

    await connectToDatabase();
    
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const comment = {
      author: session.user.id,
      text: content,
      createdAt: new Date()
    };

    post.comments.push(comment as any);
    await post.save();

    // Populate user info for the new comment
    const user = await User.findById(session.user.id).select('name image');
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ 
      message: "Comment added", 
      comment: {
        ...comment,
        _id: post.comments[post.comments.length - 1]._id,
        author: { _id: user._id, name: user.name, image: user.image }
      } 
    });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
