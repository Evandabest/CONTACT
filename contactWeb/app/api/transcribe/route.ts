import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_ANON_OPENAI_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { audioData, format = 'webm' } = await req.json();

    if (!audioData) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_ANON_OPENAI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(audioData, 'base64');

    console.log('🎵 Starting transcription process...');
    console.log('📊 Audio data size:', buffer.length, 'bytes');
    console.log('🎵 Audio format:', format);

    // Check if audio data is too small to contain meaningful speech
    if (buffer.length < 2000) {
      console.log('🔇 Audio data too small, skipping transcription:', buffer.length, 'bytes');
      return NextResponse.json({
        success: false,
        transcription: '',
        reason: 'Audio data too small to contain meaningful speech',
        timestamp: Date.now(),
      });
    }

    // Additional validation for combined audio chunks
    if (buffer.length > 50000000) { // 50MB limit
      console.log('🔇 Audio data too large, skipping transcription:', buffer.length, 'bytes');
      return NextResponse.json({
        success: false,
        transcription: '',
        reason: 'Audio data too large',
        timestamp: Date.now(),
      });
    }

    // Determine the correct MIME type based on the format
    let mimeType: string;
    let fileName: string;
    
    switch (format.toLowerCase()) {
      case 'webm':
        mimeType = 'audio/webm;codecs=opus';
        fileName = 'audio.webm';
        break;
      case 'mp4':
        mimeType = 'audio/mp4';
        fileName = 'audio.mp4';
        break;
      case 'ogg':
        mimeType = 'audio/ogg;codecs=opus';
        fileName = 'audio.ogg';
        break;
      case 'wav':
        mimeType = 'audio/wav';
        fileName = 'audio.wav';
        break;
      default:
        mimeType = 'audio/webm;codecs=opus';
        fileName = 'audio.webm';
    }

    console.log('🎵 Using MIME type:', mimeType);
    console.log('🎵 File name:', fileName);

    // Create a file-like object for OpenAI
    const file = new File([buffer], fileName, {
      type: mimeType,
    });

    console.log('🤖 Sending to OpenAI Whisper...');
    console.log('📁 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Optional: specify language
      response_format: 'text',
    });

    console.log('✅ TRANSCRIPTION SUCCESSFUL!');
    console.log('🎤 Transcribed text:', transcription);
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Call the reasoning endpoint
    let reasoningResult = null;
    try {
      const reasoningRes = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/reasoning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription,
          context: 'Live audio transcription'
        }),
      });
      reasoningResult = await reasoningRes.json();
    } catch (reasoningError) {
      console.error('Reasoning API error:', reasoningError);
    }

    return NextResponse.json({
      success: true,
      transcription,
      reasoning: reasoningResult?.analysis || null,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to transcribe audio';
    if (error instanceof Error) {
      if (error.message.includes('Invalid file format')) {
        errorMessage = 'Audio format not supported. Please try again.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Audio file format issue. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 