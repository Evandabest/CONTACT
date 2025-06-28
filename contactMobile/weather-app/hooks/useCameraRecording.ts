import { useState, useRef, useCallback } from 'react';
import { Camera, CameraType } from 'expo-camera';
import { io, Socket } from 'socket.io-client';

export const useCameraRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [camera, setCamera] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request camera permissions
      const permission = await Camera.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('Permission to access camera was denied');
        return;
      }

      // Initialize socket connection if not already connected
      if (!socketRef.current) {
        socketRef.current = io('http://localhost:3001', {
          transports: ['websocket'],
          timeout: 20000,
        });

        socketRef.current.on('connect', () => {
          console.log('🔌 Camera recording socket connected');
        });

        socketRef.current.on('disconnect', () => {
          console.log('🔌 Camera recording socket disconnected');
        });
      }

      console.log('📷 Camera recording started');

    } catch (error) {
      console.error('Error starting camera recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (camera && isRecording) {
        await camera.stopRecording();
        setIsRecording(false);
        console.log('⏹️ Camera recording stopped');
      }
    } catch (error) {
      console.error('Error stopping camera recording:', error);
    }
  }, [camera, isRecording]);

  const capturePhoto = useCallback(async () => {
    try {
      if (camera) {
        const photo = await camera.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo.base64 && socketRef.current) {
          console.log('📸 Photo captured, sending to server');
          
          // Send photo to server via Socket.IO
          socketRef.current.emit('photoData', {
            photoData: photo.base64,
            format: 'jpeg',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  }, [camera]);

  const startVideoRecording = useCallback(async () => {
    try {
      if (camera && !isRecording) {
        await camera.recordAsync({
          quality: '720p',
          maxDuration: 30, // 30 seconds max
          mute: false,
        }).then((video: { uri: string }) => {
          console.log('🎥 Video recorded:', video.uri);
          
          // Send video to server
          if (video.uri && socketRef.current) {
            fetch(video.uri)
              .then(response => response.blob())
              .then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64Data = reader.result as string;
                  const base64Video = base64Data.split(',')[1];
                  
                  socketRef.current?.emit('videoData', {
                    videoData: base64Video,
                    format: 'mp4',
                    timestamp: new Date().toISOString(),
                  });
                };
                reader.readAsDataURL(blob);
              })
              .catch(error => {
                console.error('Error processing video file:', error);
              });
          }
        });
        
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting video recording:', error);
    }
  }, [camera, isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    capturePhoto,
    startVideoRecording,
    setCamera,
  };
}; 