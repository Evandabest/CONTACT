import { useState, useCallback, useRef } from 'react';

interface TwilioCall {
  callSid: string;
  status: string;
  to: string;
  message: string;
}

interface UseTwilioReturn {
  isCalling: boolean;
  activeCall: TwilioCall | null;
  error: string | null;
  makeCall: (to: string, message?: string) => Promise<boolean>;
  endCall: () => Promise<void>;
  sendAudioToCall: (audioData: ArrayBuffer | Blob) => Promise<void>;
}

export const useTwilio = (): UseTwilioReturn => {
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState<TwilioCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fallback call storage for immediate access
  const currentCallRef = useRef<TwilioCall | null>(null);

  const makeCall = useCallback(async (to: string, message?: string): Promise<boolean> => {
    try {
      console.log('📞 makeCall called with:', { to, message });
      setIsCalling(true);
      setError(null);

      console.log('🌐 Making API request to /api/twilio...');
      const response = await fetch('/api/twilio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          message: message || 'Emergency call initiated. Please stay on the line to hear live audio.',
        }),
      });

      console.log('📡 API response status:', response.status);
      const result = await response.json();
      console.log('📡 API response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate call');
      }

      if (result.success) {
        const newCall = {
          callSid: result.callSid,
          status: result.status,
          to,
          message: message || 'Emergency call initiated. Please stay on the line to hear live audio.',
        };
        
        console.log('✅ Setting active call:', newCall);
        setActiveCall(newCall);
        currentCallRef.current = newCall; // Store in ref for immediate access
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Twilio call initiated:', result);
        return true;
      } else {
        throw new Error(result.error || 'Failed to initiate call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make call';
      setError(errorMessage);
      console.error('❌ Twilio call error:', err);
      return false;
    } finally {
      setIsCalling(false);
    }
  }, []);

  const endCall = useCallback(async (): Promise<void> => {
    if (!activeCall) return;

    try {
      // Note: Twilio calls are typically ended by the recipient or when the call duration expires
      // We can't directly end a call from the client side for security reasons
      console.log('Call ended by recipient or timeout');
      setActiveCall(null);
      currentCallRef.current = null;
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [activeCall]);

  const sendAudioToCall = useCallback(async (audioData: ArrayBuffer | Blob): Promise<void> => {
    // Use ref for immediate access, fallback to state
    const currentCall = currentCallRef.current || activeCall;
    
    if (!currentCall) {
      console.log('❌ No active call to send audio to');
      return;
    }

    try {
      console.log('📞 sendAudioToCall called with:', {
        audioDataSize: audioData instanceof Blob ? audioData.size : audioData.byteLength,
        audioDataType: audioData instanceof Blob ? audioData.type : 'ArrayBuffer',
        activeCallSid: currentCall.callSid
      });

      // Convert audio data to base64
      const blob = audioData instanceof ArrayBuffer ? new Blob([audioData]) : audioData;
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const audioBase64 = base64Data.split(',')[1]; // Remove data URL prefix

        console.log('📤 Sending audio to streaming endpoint, size:', audioBase64.length);

        // Send audio to the streaming endpoint
        const response = await fetch('/api/twilio/audio-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioData: audioBase64,
            callSid: currentCall.callSid,
          }),
        });

        const result = await response.json();
        console.log('📡 Audio stream response:', result);

        if (!response.ok) {
          console.error('❌ Failed to send audio to stream:', result);
        } else {
          console.log('✅ Audio sent to stream successfully');
        }
      };

      reader.onerror = (error) => {
        console.error('❌ Error reading audio data:', error);
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('❌ Error sending audio to call:', err);
    }
  }, [activeCall]);

  return {
    isCalling,
    activeCall,
    error,
    makeCall,
    endCall,
    sendAudioToCall,
  };
}; 