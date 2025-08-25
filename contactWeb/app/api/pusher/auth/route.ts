import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.text();
    const params = new URLSearchParams(data);
    const socketId = params.get('socket_id');
    const channel = params.get('channel_name');

    if (!socketId || !channel) {
      return new NextResponse('Bad request: socket_id and channel_name are required.', { status: 400 });
    }

    // For this demonstration, we are authorizing any client.
    // In a production app, you would add logic here to verify that the
    // user is authenticated and has permission to access the channel.
    const authResponse = pusherServer.authorizeChannel(socketId, channel);

    const headers = {
      'Access-Control-Allow-Origin': '*', // IMPORTANT: In production, lock this down to your operatorWeb domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Pusher-App-Key, X-Pusher-Cluster',
    };
    
    return new NextResponse(JSON.stringify(authResponse), { status: 200, headers });

  } catch (error) {
    console.error('Pusher auth error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle CORS preflight requests for the browser
export async function OPTIONS(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // IMPORTANT: In production, lock this down
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Pusher-App-Key, X-Pusher-Cluster',
  };
  return new NextResponse(null, { status: 204, headers });
} 