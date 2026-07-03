import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);
    await connectToDatabase();

    let query: any = { visibility: { $ne: 'private' } }; // Default: only show public posts

    if (session && session.user) {
      const currentUser = await User.findById((session.user as any).id).lean();
      const followingIds = currentUser?.following || [];
      
      // If logged in, show: public posts, OR my own private posts, OR private posts of people I follow
      query = {
        $or: [
          { visibility: { $ne: 'private' } },
          { visibility: 'private', author: (session.user as any).id },
          { visibility: 'private', author: { $in: followingIds } }
        ]
      };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name image')
      .populate('comments.author', 'name image')
      .populate('likes', 'name image')
      .lean();

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Fetch posts error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content, imageUrl, visibility } = await req.json();

    if (!content && !imageUrl) {
      return NextResponse.json({ message: "Content or Image is required" }, { status: 400 });
    }

    await connectToDatabase();

    const newPost = await Post.create({
      author: (session.user as any).id,
      content,
      imageUrl,
      visibility: visibility === 'private' ? 'private' : 'public',
    });

    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'name image')
      .populate('likes', 'name image')
      .lean();

    return NextResponse.json(populatedPost, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
