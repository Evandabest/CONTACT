import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketState {
  isConnected: boolean;
  isRecording: boolean;
  transcription: string;
  error: string | null;
  isDevelopment: boolean;
}

export const useWebSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isRecording: false,
    transcription: '',
    error: null,
    isDevelopment: process.env.NODE_ENV === 'development',
  });

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    // In development, WebSocket won't work, so we'll simulate it
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: WebSocket functionality simulated');
      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        error: 'Development mode - WebSocket simulated',
        isDevelopment: true 
      }));
      return;
    }

    try {
      // Connect to the Vercel WebSocket endpoint
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/socket`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      };

      socketRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Try to reconnect after a delay if it wasn't a normal closure
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcriptionUpdate') {
            console.log('🎤 TRANSCRIPTION RECEIVED:', data.text);
            console.log('📝 Full transcription data:', data);
            setState(prev => ({ 
              ...prev, 
              transcription: data.text || data.transcription || '',
            }));
          } else if (data.type === 'audioReceived') {
            console.log('Audio received confirmation:', data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to connect to audio service',
          isConnected: false 
        }));
      };

    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize audio service',
        isConnected: false 
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isRecording: false,
        transcription: '',
        error: null 
      }));
    }
  }, []);

  const sendAudioData = useCallback((audioData: ArrayBuffer | Blob) => {
    // In development, send to transcription API directly
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Audio data received (simulated)', {
        size: audioData instanceof Blob ? audioData.size : audioData.byteLength,
        type: audioData instanceof Blob ? audioData.type : 'ArrayBuffer'
      });
      
      // Convert to Blob if it's an ArrayBuffer
      const blob = audioData instanceof ArrayBuffer ? new Blob([audioData]) : audioData;
      
      // Detect the format from the MIME type
      let format = 'webm'; // default
      if (blob.type) {
        if (blob.type.includes('webm')) {
          format = 'webm';
        } else if (blob.type.includes('mp4')) {
          format = 'mp4';
        } else if (blob.type.includes('ogg')) {
          format = 'ogg';
        } else if (blob.type.includes('wav')) {
          format = 'wav';
        }
      }
      
      console.log('🎵 Detected audio format:', format, 'from MIME type:', blob.type);
      
      // Convert Blob to base64 for API transmission
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const audioBase64 = base64Data.split(',')[1]; // Remove data URL prefix
        
        // Send to transcription API
        fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioData: audioBase64,
            format: format
          }),
        })
        .then(response => response.json())
        .then(result => {
          if (result.success && result.transcription) {
            console.log('🎤 DEVELOPMENT TRANSCRIPTION RECEIVED:', result.transcription);
            console.log('📝 Full transcription data:', result);
            setState(prev => ({ 
              ...prev, 
              transcription: result.transcription,
            }));
          } else if (result.success === false && result.reason === 'Audio data too small to contain meaningful speech') {
            console.log('🔇 Audio too small, skipping transcription');
            // Don't update state, just skip this chunk
          } else {
            console.error('❌ Development transcription failed:', result.error);
          }
        })
        .catch(error => {
          console.error('❌ Development transcription error:', error);
        });
      };
      reader.readAsDataURL(blob);
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      // Convert to Blob if it's an ArrayBuffer
      const blob = audioData instanceof ArrayBuffer ? new Blob([audioData]) : audioData;
      
      // Convert Blob to base64 for JSON transmission
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const message = {
          type: 'audioData',
          data: base64Data.split(',')[1] // Remove data URL prefix
        };
        socketRef.current?.send(JSON.stringify(message));
      };
      reader.readAsDataURL(blob);
    } else {
      console.warn('WebSocket not connected, cannot send audio data');
    }
  }, []);

  const startRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: true, transcription: '' }));
  }, []);

  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  const clearTranscription = useCallback(() => {
    setState(prev => ({ ...prev, transcription: '' }));
  }, []);

  useEffect(() => {
    // Auto-connect when hook is first used
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendAudioData,
    startRecording,
    stopRecording,
    clearTranscription,
  };
}; 