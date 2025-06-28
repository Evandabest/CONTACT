import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Camera, CameraType } from 'expo-camera';
import { io, Socket } from 'socket.io-client';

interface LiveStreamingConfig {
  audioInterval: number; // milliseconds between audio chunks
  videoInterval: number; // milliseconds between video frames
  photoInterval: number; // milliseconds between photos
}

export const useLiveStreaming = (config: LiveStreamingConfig = {
  audioInterval: 5000, // 5 seconds
  videoInterval: 3000, // 3 seconds  
  photoInterval: 10000, // 10 seconds
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [camera, setCamera] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const photoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Audio.Recording[]>([]);
  const isRecordingRef = useRef(false);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3001', {
        transports: ['websocket'],
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        console.log('🔌 Live streaming socket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 Live streaming socket disconnected');
      });

      socketRef.current.on('transcriptionUpdate', (data) => {
        console.log('📝 Live transcription update:', data);
      });
    }
  }, []);

  // Start audio recording for live streaming
  const startAudioRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('Permission to access microphone was denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      isRecordingRef.current = true;
      console.log('🎤 Live audio recording started');

    } catch (error) {
      console.error('Error starting live audio recording:', error);
    }
  }, []);

  // Send audio chunk periodically
  const sendAudioChunk = useCallback(async () => {
    if (!recording || !socketRef.current || !isRecordingRef.current) return;

    try {
      // Create a new recording for this chunk
      const { recording: chunkRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Record for a short duration (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await chunkRecording.stopAndUnloadAsync();
      const uri = chunkRecording.getURI();

      if (uri) {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result as string;
          const base64Audio = base64Data.split(',')[1];
          
          let format = 'm4a';
          if (blob.type.includes('webm')) {
            format = 'webm';
          } else if (blob.type.includes('wav')) {
            format = 'wav';
          }
          
          console.log('🎵 Sending live audio chunk');
          
          socketRef.current?.emit('audioData', {
            audioData: base64Audio,
            format: format,
            isLiveStream: true,
            timestamp: new Date().toISOString()
          });
        };
        reader.readAsDataURL(blob);
      }

    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  }, [recording]);

  // Send video frame periodically
  const sendVideoFrame = useCallback(async () => {
    if (!camera || !socketRef.current) return;

    try {
      const photo = await camera.takePictureAsync({
        quality: 0.6, // Lower quality for faster transmission
        base64: true,
      });

      if (photo.base64) {
        console.log('📹 Sending live video frame');
        
        socketRef.current.emit('videoData', {
          videoData: photo.base64,
          format: 'jpeg',
          isLiveStream: true,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending video frame:', error);
    }
  }, [camera]);

  // Send photo periodically
  const sendPhoto = useCallback(async () => {
    if (!camera || !socketRef.current) return;

    try {
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo.base64) {
        console.log('📸 Sending live photo');
        
        socketRef.current.emit('photoData', {
          photoData: photo.base64,
          format: 'jpeg',
          isLiveStream: true,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending photo:', error);
    }
  }, [camera]);

  // Start live streaming
  const startLiveStreaming = useCallback(async () => {
    try {
      initializeSocket();
      await startAudioRecording();

      setIsStreaming(true);
      console.log('🚀 Live streaming started');

      // Start periodic data transmission
      audioIntervalRef.current = setInterval(sendAudioChunk, config.audioInterval);
      videoIntervalRef.current = setInterval(sendVideoFrame, config.videoInterval);
      photoIntervalRef.current = setInterval(sendPhoto, config.photoInterval);

    } catch (error) {
      console.error('Error starting live streaming:', error);
    }
  }, [initializeSocket, startAudioRecording, sendAudioChunk, sendVideoFrame, sendPhoto, config]);

  // Stop live streaming
  const stopLiveStreaming = useCallback(async () => {
    try {
      // Clear all intervals
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
        photoIntervalRef.current = null;
      }

      // Stop audio recording
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
        isRecordingRef.current = false;
      }

      setIsStreaming(false);
      console.log('⏹️ Live streaming stopped');

    } catch (error) {
      console.error('Error stopping live streaming:', error);
    }
  }, [recording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveStreaming();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [stopLiveStreaming]);

  return {
    isStreaming,
    startLiveStreaming,
    stopLiveStreaming,
    setCamera,
  };
}; 