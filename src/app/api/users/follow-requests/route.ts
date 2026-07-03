import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { requesterId } = await req.json();
    const currentUserId = (session.user as any).id;

    await connectToDatabase();
    
    const currentUser = await User.findById(currentUserId);
    const requesterUser = await User.findById(requesterId);
    
    if (!currentUser || !requesterUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if there is actually a pending request
    if (!currentUser.pendingFollowers.includes(requesterId)) {
      return NextResponse.json({ message: "No pending request from this user" }, { status: 400 });
    }

    // Accept: Remove from pending, add to followers/following
    currentUser.pendingFollowers = currentUser.pendingFollowers.filter((id: any) => id.toString() !== requesterId);
    currentUser.followers.push(requesterId);
    requesterUser.following.push(currentUserId);

    await currentUser.save();
    await requesterUser.save();

    return NextResponse.json({ message: "Request accepted" });
  } catch (error) {
    console.error("Accept request error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { requesterId } = await req.json();
    const currentUserId = (session.user as any).id;

    await connectToDatabase();
    
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Decline: Remove from pending
    currentUser.pendingFollowers = currentUser.pendingFollowers.filter((id: any) => id.toString() !== requesterId);

    await currentUser.save();

    return NextResponse.json({ message: "Request declined" });
  } catch (error) {
    console.error("Decline request error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
