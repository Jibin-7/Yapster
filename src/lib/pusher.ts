import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || '2173302',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'bcff5f384949b336e304',
  secret: process.env.PUSHER_SECRET || '45d83d9ad02e6d77d899',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
  useTLS: true,
});
