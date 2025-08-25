import { NextRequest } from 'next/server';
import { pusherServer } from '@/lib/pusher';

// Function to transcribe audio using OpenAI Whisper
async function transcribeAudio(audioData: string, format: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: audioData,
        format: format
      }),
    });

    if (!response.ok) {
      throw new Error(`Transcription API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling transcription API:', error);
    return { success: false, error: 'Transcription failed' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { audioData, format = 'webm' } = await req.json();

    if (!audioData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No audio data provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate format before processing
    const supportedFormats = ['webm', 'ogg', 'wav', 'mp3', 'm4a', 'mp4']; // Allow MP4 for conversion
    const isFormatSupported = supportedFormats.includes(format.toLowerCase());
    
    if (!isFormatSupported) {
      console.log('⚠️ Unsupported format for Whisper:', format);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Audio format '${format}' is not supported. Supported formats: ${supportedFormats.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert MP4 to WebM if needed
    let finalFormat = format;
    if (format.toLowerCase() === 'mp4') {
      finalFormat = 'webm';
      console.log('🔄 Converting MP4 to WebM for Whisper compatibility');
    }

    // Process audio data with OpenAI Whisper
    const transcriptionResult = await transcribeAudio(audioData, finalFormat);
    
    if (transcriptionResult.success && transcriptionResult.transcription) {
      console.log('🎤 TRANSCRIPTION COMPLETE');
      console.log('📝 Transcribed text:', transcriptionResult.transcription);
      
      // Trigger Pusher event with transcription data
      await pusherServer.trigger('transcription-channel', 'transcription-update', {
        type: 'transcriptionUpdate',
        text: transcriptionResult.transcription,
        analysis: transcriptionResult.analysis || null,
        emergencyCall: transcriptionResult.emergencyCall || null,
        timestamp: Date.now()
      });
      
      console.log('📡 Transcription broadcasted via Pusher');
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Audio processed and transcription broadcasted',
        transcription: transcriptionResult.transcription,
        analysis: transcriptionResult.analysis
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ Transcription failed:', transcriptionResult.error || transcriptionResult.reason);
      
      return new Response(JSON.stringify({
        success: false,
        error: transcriptionResult.error || transcriptionResult.reason || 'Transcription failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error processing audio data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 