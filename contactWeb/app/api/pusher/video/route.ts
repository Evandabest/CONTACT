import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { event, data, channel } = await req.json();

    if (!event || !data || !channel || !channel.startsWith('private-')) {
      return new NextResponse('Bad request, or channel is not a private channel', { status: 400 });
    }

    // It is important to pass the socket_id of the sender
    // so that Pusher does not send the event back to the sender.
    const socketId = req.headers.get('X-Pusher-Socket-ID');
    if(socketId) {
        await pusherServer.trigger(channel, event, data, { socket_id: socketId });
    } else {
        await pusherServer.trigger(channel, event, data);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[PUSHER_VIDEO_POST]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 