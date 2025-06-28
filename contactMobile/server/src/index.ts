import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import OpenAI from 'openai';
import { weatherRouter } from './routes/weather';
import { transcribeRouter } from './routes/transcribe';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Routes
app.use('/api/weather', weatherRouter);
app.use('/api/transcribe', transcribeRouter);

// Helper function to convert audio using FFmpeg
const convertAudioToMp3 = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .on('end', () => {
        console.log('✅ Audio conversion completed');
        resolve();
      })
      .on('error', (err: Error) => {
        console.error('❌ Audio conversion error:', err);
        reject(err);
      })
      .save(outputPath);
  });
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('audioData', async (data) => {
    let tempWebmPath: string | null = null;
    let tempMp3Path: string | null = null;

    try {
      console.log('🎵 Received audio data from client:', socket.id);
      
      // Process audio data for transcription
      const { audioData, format = 'webm' } = data;
      
      if (!audioData) {
        socket.emit('transcriptionUpdate', { 
          error: 'No audio data provided' 
        });
        return;
      }

      // Initialize OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Convert base64 to buffer
      const buffer = Buffer.from(audioData, 'base64');

      // Validate audio size
      if (buffer.length < 2000) {
        console.log('🔇 Audio data too small, skipping transcription');
        socket.emit('transcriptionUpdate', { 
          success: false,
          reason: 'Audio data too small to contain meaningful speech'
        });
        return;
      }

      if (buffer.length > 50000000) {
        console.log('🔇 Audio data too large, skipping transcription');
        socket.emit('transcriptionUpdate', { 
          success: false,
          reason: 'Audio data too large'
        });
        return;
      }

      console.log('🎵 Processing audio:', {
        size: buffer.length,
        format,
        originalSize: audioData.length
      });

      // Create temporary directory
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create temporary audio file with correct extension
      const audioFileName = `audio_${Date.now()}.${format}`;
      tempWebmPath = path.join(tempDir, audioFileName);
      fs.writeFileSync(tempWebmPath, buffer);

      console.log('📁 Created temporary audio file:', tempWebmPath);

      try {
        // Try sending directly to Whisper first
        console.log('🎤 Trying direct transcription...');
        const fileStream = fs.createReadStream(tempWebmPath);

        const transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          language: 'en',
          response_format: 'text',
        });

        console.log('✅ Direct transcription successful:', transcription);

        // Send transcription back to client
        socket.emit('transcriptionUpdate', {
          success: true,
          text: transcription,
          timestamp: Date.now()
        });

      } catch (directError) {
        console.log('❌ Direct transcription failed, trying conversion...');
        
        // Convert to MP3
        const mp3FileName = `audio_${Date.now()}.mp3`;
        tempMp3Path = path.join(tempDir, mp3FileName);
        
        console.log(`🔄 Converting ${format.toUpperCase()} to MP3...`);
        await convertAudioToMp3(tempWebmPath, tempMp3Path);
        console.log('📁 Created MP3 file:', tempMp3Path);

        // Create file stream for OpenAI
        const fileStream = fs.createReadStream(tempMp3Path);

        // Transcribe with OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          language: 'en',
          response_format: 'text',
        });

        console.log('✅ Conversion transcription successful:', transcription);

        // Send transcription back to client
        socket.emit('transcriptionUpdate', {
          success: true,
          text: transcription,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error('❌ Transcription error:', error);
      socket.emit('transcriptionUpdate', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // Clean up temporary files
      try {
        if (tempWebmPath && fs.existsSync(tempWebmPath)) {
          fs.unlinkSync(tempWebmPath);
          console.log('🗑️ Cleaned up audio file:', tempWebmPath);
        }
        if (tempMp3Path && fs.existsSync(tempMp3Path)) {
          fs.unlinkSync(tempMp3Path);
          console.log('🗑️ Cleaned up MP3 file:', tempMp3Path);
        }
      } catch (cleanupError) {
        console.error('❌ Error cleaning up files:', cleanupError);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌤️ Weather API: http://localhost:${PORT}/api/weather`);
  console.log(`🎤 Transcription API: http://localhost:${PORT}/api/transcribe`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

export { io }; 