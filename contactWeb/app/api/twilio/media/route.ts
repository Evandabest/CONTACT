import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const upgrade = req.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }

  // Only works in production (Edge runtime does not support WebSocket upgrade)
  const { socket, response } = (globalThis as any).Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log('Twilio Media Stream WebSocket connected');
  };

  socket.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string);
      // Handle Twilio Media Stream events here
      if (data.event === 'start') {
        console.log('Twilio stream started:', data.streamSid);
      } else if (data.event === 'media') {
        // data.media.payload is base64-encoded audio
        // You can forward this to your browser client, save, etc.
        // Example: decode and log length
        const audioBuffer = Buffer.from(data.media.payload, 'base64');
        console.log('Received audio chunk:', audioBuffer.length, 'bytes');
      } else if (data.event === 'stop') {
        console.log('Twilio stream stopped:', data.streamSid);
      }
    } catch (err) {
      console.error('Error parsing Twilio Media Stream message:', err);
    }
  };

  socket.onclose = () => {
    console.log('Twilio Media Stream WebSocket disconnected');
  };

  socket.onerror = (err: Event) => {
    console.error('Twilio Media Stream WebSocket error:', err);
  };

  return response;
} 