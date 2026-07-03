import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const user = await User.findById(id)
      .populate('followers', 'name image')
      .populate('following', 'name image')
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      followers: user.followers,
      following: user.following
    });
  } catch (error) {
    console.error("Fetch network error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
