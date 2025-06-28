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

  // Handle photo data from camera
  socket.on('photoData', async (data) => {
    try {
      console.log('📸 Received photo data from client:', socket.id);
      
      const { photoData, format = 'jpeg', timestamp } = data;
      
      if (!photoData) {
        console.error('❌ No photo data provided');
        return;
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(photoData, 'base64');

      // Validate photo size
      if (buffer.length < 1000) {
        console.log('🔇 Photo data too small, skipping');
        return;
      }

      if (buffer.length > 10000000) { // 10MB limit
        console.log('🔇 Photo data too large, skipping');
        return;
      }

      console.log('📸 Processing photo:', {
        size: buffer.length,
        format,
        timestamp,
        originalSize: photoData.length
      });

      // Create media directory
      const mediaDir = path.join(__dirname, '../media');
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      // Create photos subdirectory
      const photosDir = path.join(mediaDir, 'photos');
      if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
      }

      // Save photo with timestamp
      const photoFileName = `photo_${Date.now()}.${format}`;
      const photoPath = path.join(photosDir, photoFileName);
      fs.writeFileSync(photoPath, buffer);

      console.log('📁 Saved photo:', photoPath);

      // Send confirmation back to client
      socket.emit('photoReceived', {
        success: true,
        filename: photoFileName,
        timestamp: Date.now(),
        size: buffer.length
      });

    } catch (error) {
      console.error('❌ Photo processing error:', error);
      socket.emit('photoReceived', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle video data from camera
  socket.on('videoData', async (data) => {
    try {
      console.log('🎥 Received video data from client:', socket.id);
      
      const { videoData, format = 'mp4', timestamp } = data;
      
      if (!videoData) {
        console.error('❌ No video data provided');
        return;
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(videoData, 'base64');

      // Validate video size
      if (buffer.length < 10000) {
        console.log('🔇 Video data too small, skipping');
        return;
      }

      if (buffer.length > 100000000) { // 100MB limit
        console.log('🔇 Video data too large, skipping');
        return;
      }

      console.log('🎥 Processing video:', {
        size: buffer.length,
        format,
        timestamp,
        originalSize: videoData.length
      });

      // Create media directory
      const mediaDir = path.join(__dirname, '../media');
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      // Create videos subdirectory
      const videosDir = path.join(mediaDir, 'videos');
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }

      // Save video with timestamp
      const videoFileName = `video_${Date.now()}.${format}`;
      const videoPath = path.join(videosDir, videoFileName);
      fs.writeFileSync(videoPath, buffer);

      console.log('📁 Saved video:', videoPath);

      // Send confirmation back to client
      socket.emit('videoReceived', {
        success: true,
        filename: videoFileName,
        timestamp: Date.now(),
        size: buffer.length
      });

    } catch (error) {
      console.error('❌ Video processing error:', error);
      socket.emit('videoReceived', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

// Media files endpoint
app.get('/media/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    
    // Validate type
    if (!['photos', 'videos'].includes(type)) {
      return res.status(400).json({ error: 'Invalid media type' });
    }
    
    const mediaPath = path.join(__dirname, '../media', type, filename);
    
    if (!fs.existsSync(mediaPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.mp4') {
      contentType = 'video/mp4';
    } else if (ext === '.webm') {
      contentType = 'video/webm';
    }
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(mediaPath);
    
  } catch (error) {
    console.error('Error serving media file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List media files endpoint
app.get('/api/media/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate type
    if (!['photos', 'videos'].includes(type)) {
      return res.status(400).json({ error: 'Invalid media type' });
    }
    
    const mediaDir = path.join(__dirname, '../media', type);
    
    if (!fs.existsSync(mediaDir)) {
      return res.json({ files: [] });
    }
    
    const files = fs.readdirSync(mediaDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        if (type === 'photos') {
          return ['.jpg', '.jpeg', '.png'].includes(ext);
        } else {
          return ['.mp4', '.webm', '.mov'].includes(ext);
        }
      })
      .map(file => {
        const filePath = path.join(mediaDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    res.json({ files });
    
  } catch (error) {
    console.error('Error listing media files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌤️ Weather API: http://localhost:${PORT}/api/weather`);
  console.log(`🎤 Transcription API: http://localhost:${PORT}/api/transcribe`);
  console.log(`📸 Media API: http://localhost:${PORT}/api/media/photos`);
  console.log(`🎥 Video API: http://localhost:${PORT}/api/media/videos`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📱 Emergency triggers: audioData, photoData, videoData`);
});

export { io }; 