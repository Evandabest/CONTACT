'use client';

import { useState, useCallback, useRef } from 'react';

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const mediaStream = useRef<MediaStream | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // First, try to get video and audio
        try {
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: true 
            });
            setStream(mediaStream.current);
            setError(null);
            return true;
        } catch (err) {
            console.warn("Could not get audio and video stream, trying video only.");
            // If that fails, try to get only video
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream.current);
            setError(null);
            return true;
        }
      } else {
        setError('getUserMedia is not supported by this browser.');
        return false;
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error getting camera permission: ${err.message}`);
      } else {
        setError('An unknown error occurred while getting camera permission.');
      }
      return false;
    }
  }, []);

  const startStreaming = useCallback(async () => {
    if (!mediaStream.current) {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        console.error("Permission not granted, cannot start streaming.");
        return null;
      }
    }
    
    setIsStreaming(true);
    return mediaStream.current;
  }, [requestPermission]);

  const stopStreaming = useCallback(() => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
      setStream(null);
    }
    setIsStreaming(false);
  }, []);

  return {
    stream,
    error,
    isStreaming,
    requestPermission,
    startStreaming,
    stopStreaming,
  };
} 