import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Transcribe audio file
router.post('/file', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { buffer, mimetype, originalname } = req.file;

    // Validate file size
    if (buffer.length < 2000) {
      return res.status(400).json({ 
        error: 'Audio file too small to contain meaningful speech' 
      });
    }

    if (buffer.length > 50000000) {
      return res.status(400).json({ 
        error: 'Audio file too large (max 50MB)' 
      });
    }

    // Validate MIME type
    const validMimeTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg',
      'audio/mp3'
    ];

    if (!validMimeTypes.some(type => mimetype.startsWith(type))) {
      return res.status(400).json({ 
        error: 'Invalid audio file format' 
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Determine file extension
    let fileExtension = 'webm';
    if (mimetype.includes('mp4')) fileExtension = 'mp4';
    else if (mimetype.includes('ogg')) fileExtension = 'ogg';
    else if (mimetype.includes('wav')) fileExtension = 'wav';
    else if (mimetype.includes('mpeg') || mimetype.includes('mp3')) fileExtension = 'mp3';

    const fileName = `audio.${fileExtension}`;

    console.log('🎵 Processing audio file:', {
      originalName: originalname,
      mimeType: mimetype,
      size: buffer.length,
      fileName
    });

    // Create file for OpenAI
    const file = new File([buffer], fileName, { type: mimetype });

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file as any,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    console.log('✅ Transcription successful');

    res.json({
      success: true,
      text: transcription,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Transcribe base64 audio data
router.post('/base64', async (req, res) => {
  try {
    const { audioData, format = 'webm' } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Convert base64 to buffer
    const buffer = Buffer.from(audioData, 'base64');

    // Validate audio size
    if (buffer.length < 2000) {
      return res.status(400).json({ 
        error: 'Audio data too small to contain meaningful speech' 
      });
    }

    if (buffer.length > 50000000) {
      return res.status(400).json({ 
        error: 'Audio data too large (max 50MB)' 
      });
    }

    // Determine MIME type
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

    console.log('🎵 Processing audio data:', {
      size: buffer.length,
      format,
      mimeType,
      fileName
    });

    // Create file for OpenAI
    const file = new File([buffer], fileName, { type: mimeType });

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file as any,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    console.log('✅ Transcription successful');

    res.json({
      success: true,
      text: transcription,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as transcribeRouter }; 