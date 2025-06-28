import { useRef, useState, useCallback, useEffect } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  error: string | null;
}

export const useAudioRecorder = (onAudioData: (data: Blob) => void) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);
  const isProcessingChunkRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Chunk batching for rate limiting
  const audioChunksRef = useRef<Blob[]>([]);
  const chunkCountRef = useRef(0);
  const hasSpeechInBatchRef = useRef(false);
  const BATCH_SIZE = 7; // 7 chunks = 21 seconds

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isSupported: false,
    hasPermission: false,
    error: null,
  });

  // Check if MediaRecorder is supported
  useEffect(() => {
    const isSupported = !!(navigator.mediaDevices && window.MediaRecorder);
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Get supported MIME type
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using MIME type:', type);
        return type;
      }
    }
    
    console.warn('No supported MIME type found, using default');
    return '';
  };

  // Function to send batched audio chunks to transcription
  const sendBatchToTranscription = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log('No audio chunks to send');
      return;
    }

    try {
      console.log(`🎵 Combining ${audioChunksRef.current.length} audio chunks...`);
      
      // Get the MIME type from the first chunk
      const firstChunk = audioChunksRef.current[0];
      const mimeType = firstChunk?.type || 'audio/webm;codecs=opus';
      
      // Validate that all chunks have the same MIME type
      const allSameType = audioChunksRef.current.every(chunk => chunk.type === mimeType);
      if (!allSameType) {
        console.warn('⚠️ Audio chunks have different MIME types, using first chunk type:', mimeType);
        console.log('Chunk types:', audioChunksRef.current.map(chunk => chunk.type));
      }
      
      console.log('🎵 Using MIME type for combined audio:', mimeType);
      
      // Combine all audio chunks into a single blob with the correct MIME type
      const combinedBlob = new Blob(audioChunksRef.current, { 
        type: mimeType
      });
      
      console.log(`📊 Combined audio size: ${combinedBlob.size} bytes`);
      console.log(`🎵 Combined audio type: ${combinedBlob.type}`);
      
      // Validate the combined blob
      if (combinedBlob.size < 2000) {
        console.log('🔇 Combined audio too small, skipping transcription');
        // Reset batch
        audioChunksRef.current = [];
        chunkCountRef.current = 0;
        hasSpeechInBatchRef.current = false;
        return;
      }
      
      // Send the combined audio to the callback
      onAudioData(combinedBlob);
      
      // Reset batch
      audioChunksRef.current = [];
      chunkCountRef.current = 0;
      hasSpeechInBatchRef.current = false;
      
      console.log('🔄 Batch reset, starting new batch');
      
    } catch (error) {
      console.error('Error sending batch to transcription:', error);
      // Reset batch on error
      audioChunksRef.current = [];
      chunkCountRef.current = 0;
      hasSpeechInBatchRef.current = false;
    }
  };

  // Function to check if audio contains meaningful content
  const hasAudioContent = (audioData: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      // Quick size check - if it's too small, likely no content
      if (audioData.size < 1000) {
        console.log('Audio chunk too small, skipping:', audioData.size, 'bytes');
        resolve(false);
        return;
      }

      // Create audio context to analyze the audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Get audio data
          const channelData = audioBuffer.getChannelData(0);
          
          // Calculate RMS (Root Mean Square) to detect audio level
          let sum = 0;
          for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sum / channelData.length);
          
          // Threshold for meaningful audio (adjust as needed)
          const threshold = 0.01; // Very low threshold to catch quiet speech
          const hasContent = rms > threshold;
          
          console.log('Audio analysis - RMS:', rms.toFixed(6), 'Threshold:', threshold, 'Has content:', hasContent);
          
          audioContext.close();
          resolve(hasContent);
        } catch (error) {
          console.log('Audio analysis failed, assuming no content:', error);
          audioContext.close();
          resolve(false);
        }
      };
      
      reader.readAsArrayBuffer(audioData);
    });
  };

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Audio recording is not supported in this browser' 
      }));
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        } 
      });
      
      // Ensure the stream is active
      if (stream.active) {
        console.log('Stream is active with tracks:', stream.getTracks().length);
        streamRef.current = stream;
        setState(prev => ({ 
          ...prev, 
          hasPermission: true, 
          error: null 
        }));
        return true;
      } else {
        throw new Error('Stream is not active');
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setState(prev => ({ 
        ...prev, 
        hasPermission: false,
        error: 'Microphone access denied. Please allow microphone access to use this feature.' 
      }));
      return false;
    }
  }, [state.isSupported]);

  const startRecording = useCallback(async () => {
    try {
      isActiveRef.current = true;
      isProcessingChunkRef.current = false;
      
      // Reset batch for new recording session
      audioChunksRef.current = [];
      chunkCountRef.current = 0;
      hasSpeechInBatchRef.current = false;
      console.log('🔄 Starting new recording session with fresh batch');
      
      // Only clean up if we're already recording
      if (mediaRecorderRef.current && state.isRecording) {
        console.log('Stopping existing recording to restart');
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      
      // Don't stop the stream, just reuse it
      if (!streamRef.current) {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;
      }

      // Ensure we have a valid stream
      if (!streamRef.current || !(streamRef.current as MediaStream).active) {
        throw new Error('No active stream available');
      }

      // Wait for stream to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Double-check stream is still active
      if (!(streamRef.current as MediaStream).active) {
        throw new Error('Stream became inactive during initialization');
      }

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      
      console.log('Creating MediaRecorder with options:', options);
      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          console.log('Audio data available:', event.data.size, 'bytes');
          
          // Check if the audio contains meaningful content
          const hasContent = await hasAudioContent(event.data);
          
          if (hasContent) {
            console.log('✅ Audio contains meaningful content, adding to batch');
            // Add to batch and mark that this batch has speech
            audioChunksRef.current.push(event.data);
            chunkCountRef.current++;
            hasSpeechInBatchRef.current = true;
            
            console.log(`📦 Batch progress: ${chunkCountRef.current}/${BATCH_SIZE} chunks (has speech)`);
            
            // Send batch if we have enough chunks
            if (chunkCountRef.current >= BATCH_SIZE) {
              console.log('📤 Sending batch to transcription (21 seconds of audio with speech)');
              await sendBatchToTranscription();
            }
          } else {
            console.log('🔇 Audio chunk contains no meaningful content, skipping');
            // Still add to batch to maintain timing, but don't mark as having speech
            audioChunksRef.current.push(event.data);
            chunkCountRef.current++;
            
            console.log(`📦 Batch progress: ${chunkCountRef.current}/${BATCH_SIZE} chunks (silent)`);
            
            // Only send batch if it contains speech and we have enough chunks
            if (chunkCountRef.current >= BATCH_SIZE && hasSpeechInBatchRef.current) {
              console.log('📤 Sending batch to transcription (21 seconds of audio with speech)');
              await sendBatchToTranscription();
            } else if (chunkCountRef.current >= BATCH_SIZE && !hasSpeechInBatchRef.current) {
              console.log('🔇 Batch contains no speech, discarding batch');
              // Reset batch without sending
              audioChunksRef.current = [];
              chunkCountRef.current = 0;
              hasSpeechInBatchRef.current = false;
            }
          }
        }
        
        // If still active, continue recording
        if (isActiveRef.current && mediaRecorderRef.current) {
          console.log('Continuing to next chunk...');
          // Stop current recording to get the data, then start next chunk
          mediaRecorderRef.current.stop();
        }
      };

      // Handle recording state changes
      mediaRecorder.onstart = () => {
        console.log('Recording chunk started');
        setState(prev => ({ ...prev, isRecording: true, error: null }));
        
        // Keep the stream alive by preventing it from being garbage collected
        if (streamRef.current) {
          (streamRef.current as MediaStream).getTracks().forEach(track => {
            track.enabled = true;
          });
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording chunk stopped');
        
        // If still active, start the next chunk after a short delay
        if (isActiveRef.current && mediaRecorderRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && mediaRecorderRef.current) {
              try {
                console.log('Starting next 3-second chunk...');
                mediaRecorderRef.current.start(3000);
              } catch (error) {
                console.error('Error starting next chunk:', error);
                // If there's an error, try to restart the recording
                if (isActiveRef.current) {
                  console.log('Attempting to restart recording...');
                  setTimeout(() => {
                    if (isActiveRef.current) {
                      startRecording();
                    }
                  }, 1000);
                }
              }
            }
          }, 100); // Small delay to ensure the recorder is fully stopped
        } else {
          console.log('Recording completely stopped');
          setState(prev => ({ ...prev, isRecording: false }));
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          error: 'Recording error occurred' 
        }));
      };

      // Start recording continuously with 3-second timeslices
      console.log('Starting continuous MediaRecorder...');
      mediaRecorder.start(3000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        error: `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  }, [requestPermission, onAudioData, state.isRecording]);

  const stopRecording = useCallback(() => {
    console.log('Manually stopping recording');
    isActiveRef.current = false;
    
    // Send any remaining chunks in the batch only if it contains speech
    if (audioChunksRef.current.length > 0 && hasSpeechInBatchRef.current) {
      console.log(`📤 Sending final batch with ${audioChunksRef.current.length} chunks (contains speech)`);
      sendBatchToTranscription();
    } else if (audioChunksRef.current.length > 0 && !hasSpeechInBatchRef.current) {
      console.log(`🔇 Final batch contains no speech, discarding ${audioChunksRef.current.length} chunks`);
      // Reset batch without sending
      audioChunksRef.current = [];
      chunkCountRef.current = 0;
      hasSpeechInBatchRef.current = false;
    }
    
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const cleanup = useCallback(() => {
    console.log('Cleaning up audio recorder');
    isActiveRef.current = false;
    
    if (mediaRecorderRef.current) {
      if (state.isRecording) {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isRecording: false,
      hasPermission: false 
    }));
  }, [state.isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if we're not actively recording
      if (!isActiveRef.current) {
        cleanup();
      }
    };
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    requestPermission,
    cleanup,
  };
}; 