import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { redirect } from "next/navigation";
import NotificationItem from "./NotificationItem";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  await connectToDatabase();

  const currentUser = await User.findById((session.user as any).id)
    .populate('pendingFollowers', 'name image')
    .lean();

  if (!currentUser) {
    redirect("/login");
  }

  const pendingRequests = currentUser.pendingFollowers || [];

  return (
    <div className="max-w-xl mx-auto min-h-[100dvh] sm:border-x border-gray-100 dark:border-white/5 bg-white dark:bg-black">
      <div className="flex items-center gap-3 px-4 py-4 sm:mb-6 border-b border-gray-100 dark:border-white/5 backdrop-blur-2xl bg-white/80 dark:bg-black/80 sticky top-[56px] sm:top-0 z-40">
        <Bell size={24} className="text-gray-900 dark:text-white" />
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">Notifications</h1>
      </div>

      <div className="space-y-4 px-4 pb-10 pt-4 sm:pt-0">
        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">Follow Requests</h2>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((req: any) => (
            <NotificationItem key={req._id.toString()} user={JSON.parse(JSON.stringify(req))} />
          ))
        ) : (
          <div className="text-center py-12 px-4 bg-gray-50 dark:bg-discordDarker rounded-xl border border-gray-100 dark:border-discordDark">
            <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 font-medium">No new follow requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
