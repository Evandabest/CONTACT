import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { io, Socket } from 'socket.io-client';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('Permission to access microphone was denied');
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording with high quality preset
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);

      // Initialize socket connection if not already connected
      if (!socketRef.current) {
        socketRef.current = io('http://localhost:3001', {
          transports: ['websocket'],
          timeout: 20000,
        });

        socketRef.current.on('connect', () => {
          console.log('🔌 Audio recording socket connected');
        });

        socketRef.current.on('disconnect', () => {
          console.log('🔌 Audio recording socket disconnected');
        });
      }

      console.log('🎤 Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        
        const uri = recording.getURI();
        if (uri && socketRef.current) {
          console.log('🎵 Audio URI:', uri);
          
          try {
            // Get the audio file directly from the URI
            const response = await fetch(uri);
            const blob = await response.blob();
            
            console.log('🎵 Audio blob:', {
              size: blob.size,
              type: blob.type
            });
            
            // Convert blob to base64
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = reader.result as string;
              const base64Audio = base64Data.split(',')[1]; // Remove data URL prefix
              
              // Determine format from blob type
              let format = 'm4a';
              if (blob.type.includes('webm')) {
                format = 'webm';
              } else if (blob.type.includes('wav')) {
                format = 'wav';
              } else if (blob.type.includes('mp4') || blob.type.includes('m4a')) {
                format = 'm4a';
              }
              
              console.log('🎵 Sending audio with format:', format);
              
              // Send to server via Socket.IO with detected format
              socketRef.current?.emit('audioData', {
                audioData: base64Audio,
                format: format
              });
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            console.error('Error processing audio file:', error);
          }
        }
        
        setRecording(null);
      }

      setIsRecording(false);
      console.log('⏹️ Recording stopped');

    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [recording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}; 