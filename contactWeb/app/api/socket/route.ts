import { NextRequest } from 'next/server';

// Use different runtime based on environment
export const runtime = 'nodejs';

// Store active connections
let connections: WebSocket[] = [];

// Function to transcribe audio using OpenAI Whisper
async function transcribeAudio(audioData: string, connectionId: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: audioData,
        format: 'webm'
      }),
    });

    if (!response.ok) {
      throw new Error(`Transcription API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.transcription) {
      console.log('Transcription successful for connection:', connectionId);
      return result.transcription;
    } else {
      console.error('Transcription failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error calling transcription API:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const upgrade = req.headers.get('upgrade');
  
  if (upgrade !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }

  // For development, we'll use a simple response since WebSocket upgrade doesn't work in dev
  if (process.env.NODE_ENV === 'development') {
    return new Response(JSON.stringify({ 
      message: 'WebSocket not available in development mode',
      error: 'Use production build for WebSocket functionality'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Edge Runtime WebSocket implementation for production
    const { socket, response } = (globalThis as any).Deno.upgradeWebSocket(req);
    const connectionId = crypto.randomUUID();
    
    console.log('Client connected:', connectionId);
    connections.push(socket);

    socket.onopen = () => {
      console.log('WebSocket connection opened:', connectionId);
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === 'audioData') {
          console.log('Received audio data from:', connectionId, 'size:', data.data?.length || 0);
          
          // Process audio data with OpenAI Whisper
          if (data.data) {
            const binaryData = atob(data.data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
              bytes[i] = binaryData.charCodeAt(i);
            }
            console.log('Audio data converted to binary, size:', bytes.length);
            
            // Send to transcription API
            transcribeAudio(data.data, connectionId).then((transcription: string | null) => {
              if (transcription) {
                console.log('🎤 TRANSCRIPTION COMPLETE for connection:', connectionId);
                console.log('📝 Transcribed text:', transcription);
                
                // Broadcast transcription to all connected clients
                connections.forEach((conn) => {
                  if (conn.readyState === WebSocket.OPEN) {
                    conn.send(JSON.stringify({
                      type: 'transcriptionUpdate',
                      text: transcription,
                      timestamp: Date.now()
                    }));
                  }
                });
                
                console.log('📡 Transcription broadcasted to', connections.length, 'clients');
              } else {
                console.log('❌ Transcription failed for connection:', connectionId);
              }
            }).catch((error: Error) => {
              console.error('❌ Transcription error for connection:', connectionId, error);
            });
          }
          
          // Acknowledge receipt
          socket.send(JSON.stringify({
            type: 'audioReceived',
            status: 'received',
            timestamp: Date.now()
          }));
        } else if (data.type === 'transcriptionResult') {
          console.log('Transcription result:', data);
          // Broadcast transcription to all connected clients
          connections.forEach((conn) => {
            if (conn.readyState === WebSocket.OPEN) {
              conn.send(JSON.stringify({
                type: 'transcriptionUpdate',
                ...data
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    socket.onclose = () => {
      console.log('Client disconnected:', connectionId);
      connections = connections.filter(conn => conn !== socket);
    };

    socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      connections = connections.filter(conn => conn !== socket);
    };

    return response;
  } catch (error) {
    console.error('Error upgrading WebSocket:', error);
    return new Response('WebSocket upgrade failed', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return new Response(JSON.stringify({ 
    message: 'WebSocket endpoint ready',
    connections: connections.length,
    environment: process.env.NODE_ENV
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 