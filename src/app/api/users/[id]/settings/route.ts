import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import Post from "@/lib/models/Post";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || !session.user || (session.user as any).id !== id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, bio, image } = await req.json();

    await connectToDatabase();
    
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (image !== undefined) user.image = image;

    await user.save();

    return NextResponse.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || !session.user || (session.user as any).id !== id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Delete all posts by this user
    await Post.deleteMany({ author: id });

    // Delete the user account
    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
