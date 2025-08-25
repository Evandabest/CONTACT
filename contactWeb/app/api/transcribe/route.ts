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

    // Validate format compatibility with OpenAI Whisper
    const supportedFormats = ['webm', 'ogg', 'wav', 'mp3', 'm4a', 'mp4'];
    const isFormatSupported = supportedFormats.includes(format.toLowerCase());
    
    if (!isFormatSupported) {
      console.log('⚠️ Unsupported format for Whisper:', format);
      return NextResponse.json({
        success: false,
        transcription: '',
        reason: `Audio format '${format}' is not supported by OpenAI Whisper. Supported formats: ${supportedFormats.join(', ')}`,
        timestamp: Date.now(),
      });
    }

    // Basic validation: Check if the buffer has content
    const hasContent = buffer.length > 0 && buffer.slice(0, Math.min(100, buffer.length)).some(byte => byte !== 0);
    if (!hasContent) {
      console.log('⚠️ Audio buffer appears to be empty or corrupted');
      return NextResponse.json({
        success: false,
        transcription: '',
        reason: 'Audio data appears to be empty or corrupted',
        timestamp: Date.now(),
      });
    }

    // Determine the correct MIME type based on the format
    let mimeType: string;
    let fileName: string;
    
    switch (format.toLowerCase()) {
      case 'webm':
        mimeType = 'audio/webm';
        fileName = 'audio.webm';
        break;
      case 'wav':
        mimeType = 'audio/wav';
        fileName = 'audio.wav';
        break;
      case 'ogg':
        mimeType = 'audio/ogg';
        fileName = 'audio.ogg';
        break;
      case 'mp3':
        mimeType = 'audio/mp3';
        fileName = 'audio.mp3';
        break;
      case 'm4a':
        mimeType = 'audio/m4a';
        fileName = 'audio.m4a';
        break;
      case 'mp4':
        mimeType = 'audio/mp4';
        fileName = 'audio.mp4';
        break;
      default:
        mimeType = 'audio/webm';
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
    console.log('🔍 Buffer details:', {
      length: buffer.length,
      firstBytes: Array.from(buffer.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
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

    return NextResponse.json({
      success: true,
      transcription,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to transcribe audio';
    if (error instanceof Error) {
      if (error.message.includes('Invalid file format') || error.message.includes('could not be decoded')) {
        errorMessage = 'Audio format not supported by OpenAI Whisper. Please try recording in WebM, OGG, or WAV format.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Audio file format issue. Please try recording in a different format.';
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