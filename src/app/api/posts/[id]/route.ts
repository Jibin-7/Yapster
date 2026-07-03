import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Post from "@/lib/models/Post";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const post = await Post.findById(id)
      .populate('author', 'name image')
      .populate('comments.author', 'name image')
      .populate('likes', 'name image')
      .lean();

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Fetch single post error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const post = await Post.findById(id);
    
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    post.content = content;
    await post.save();

    return NextResponse.json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();
    
    const post = await Post.findById(id);
    
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
