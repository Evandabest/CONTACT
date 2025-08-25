import { NextRequest, NextResponse } from 'next/server';
import { sendAudioToStreams, getActiveStreamCount, activeStreams } from '../../../../lib/twilioAudioStreams';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callSid = searchParams.get('CallSid');

    console.log('Audio stream request for call:', callSid);

    // Set up SSE (Server-Sent Events) for audio streaming
    const stream = new ReadableStream({
      start(controller) {
        // Store the controller for this call
        if (callSid) {
          activeStreams.set(callSid, controller);
          console.log('✅ Audio stream started for call:', callSid);
        }

        // Send initial audio format headers
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('Content-Type: audio/wav\r\n\r\n'));

        // Keep connection alive
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode('\r\n'));
          } catch (error) {
            clearInterval(keepAlive);
            if (callSid) {
              activeStreams.delete(callSid);
            }
          }
        }, 30000); // Send keep-alive every 30 seconds

        // Cleanup when stream ends
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAlive);
          if (callSid) {
            activeStreams.delete(callSid);
            console.log('❌ Audio stream ended for call:', callSid);
          }
          controller.close();
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Audio stream error:', error);
    return NextResponse.json({ error: 'Failed to create audio stream' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { audioData, callSid } = await request.json();

    if (!audioData) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    // Convert base64 audio data to ArrayBuffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // Send to all active streams
    sendAudioToStreams(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength));

    return NextResponse.json({ 
      success: true, 
      activeStreams: getActiveStreamCount() 
    });

  } catch (error) {
    console.error('Audio stream POST error:', error);
    return NextResponse.json({ error: 'Failed to process audio data' }, { status: 500 });
  }
} 