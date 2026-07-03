import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    await connectToDatabase();
    
    // Mark all received messages from this user as read
    await Message.updateMany(
      { sender: userId, receiver: session.user.id, read: false },
      { $set: { read: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: session.user.id, receiver: userId },
        { sender: userId, receiver: session.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const newMessage = await Message.create({
      sender: session.user.id,
      receiver: userId,
      content
    });

    const channelName = [session.user.id, userId].sort().join('-');
    try {
      await pusherServer.trigger(channelName, 'new-message', newMessage);
    } catch (e) {
      console.error("Pusher trigger error:", e);
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
