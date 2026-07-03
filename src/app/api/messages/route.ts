import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find all unique users the current user has messaged with
    const messages = await Message.find({
      $or: [{ sender: session.user.id }, { receiver: session.user.id }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name image')
      .populate('receiver', 'name image')
      .lean();

    // Group by conversation
    const conversationsMap = new Map();

    for (const msg of messages as any[]) {
      const otherUser = msg.sender._id.toString() === session.user.id ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unread: msg.receiver._id.toString() === session.user.id && !msg.read ? 1 : 0
        });
      } else {
        if (msg.receiver._id.toString() === session.user.id && !msg.read) {
          conversationsMap.get(otherUserId).unread += 1;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
