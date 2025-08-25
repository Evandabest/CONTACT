'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { pusherClient } from '@/lib/pusher-client';

interface ReasoningAnalysis {
  emergencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  context: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'distressed';
  actionRequired: boolean;
  suggestedActions: string[];
  confidence: number;
  reasoning: string;
}

interface PusherState {
  isConnected: boolean;
  isRecording: boolean;
  transcription: string;
  analysis: ReasoningAnalysis | null;
  emergencyCall: any | null;
  error: string | null;
  callInitiated: boolean;
  callSid: string | null;
  isStreamingVideo: boolean;
  remoteStream: MediaStream | null;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

export const usePusher = () => {
  const channelRef = useRef<any>(null);
  const videoChannelRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const isFirstChunkRef = useRef(true);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  
  const [state, setState] = useState<PusherState>({
    isConnected: false,
    isRecording: false,
    transcription: '',
    analysis: null,
    emergencyCall: null,
    error: null,
    callInitiated: false,
    callSid: null,
    isStreamingVideo: false,
    remoteStream: null,
  });

  // Function to initiate Twilio call
  const initiateEmergencyCall = useCallback(async () => {
    try {
      console.log('📞 Initiating emergency call...');
      const emergencyNumber = process.env.NEXT_PUBLIC_EMERGENCY_NUMBER;
      const response = await fetch('/api/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emergencyNumber,
          message: 'Emergency call initiated from audio transcription system'
        }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Emergency call initiated successfully:', result.callSid);
        setState(prev => ({ 
          ...prev, 
          callInitiated: true,
          callSid: result.callSid,
          emergencyCall: { success: true, callSid: result.callSid, status: result.status }
        }));
        return result.callSid;
      } else {
        console.error('❌ Failed to initiate emergency call:', result.error);
        setState(prev => ({ ...prev, emergencyCall: { success: false, error: result.error } }));
        return null;
      }
    } catch (error) {
      console.error('❌ Error initiating emergency call:', error);
      setState(prev => ({ ...prev, emergencyCall: { success: false, error: 'Failed to initiate emergency call' } }));
      return null;
    }
  }, []);

  // Function to send audio to Twilio stream (independent of video)
  const sendAudioToTwilio = useCallback(async (audioData: ArrayBuffer | Blob) => {
    try {
      if (!state.callSid) {
        console.log('📞 No active call, skipping audio stream');
        return;
      }
      const blob = audioData instanceof ArrayBuffer ? new Blob([audioData]) : audioData;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const audioBase64 = base64Data.split(',')[1];
        const response = await fetch('/api/twilio/audio-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: audioBase64, callSid: state.callSid }),
        });
        const result = await response.json();
        if (result.success) {
          console.log('✅ Audio sent to Twilio stream, active streams:', result.activeStreams);
        } else {
          console.error('❌ Failed to send audio to Twilio stream:', result.error);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('❌ Error sending audio to Twilio:', error);
    }
  }, [state.callSid]);

  const sendSignalingMessage = useCallback(async (event: string, data: any) => {
    try {
      await fetch('/api/pusher/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, channel: 'private-video-channel' }),
      });
      console.log(`📡 Sent signaling message: ${event}`);
    } catch (error) {
      console.error(`❌ Failed to send signaling message ${event}:`, error);
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    console.log('🔗 Creating new peer connection...');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('📤 Sending ICE candidate');
        sendSignalingMessage('client-ice-candidate', event.candidate);
      } else {
        console.log('🏁 ICE candidate gathering complete');
      }
    };

    pc.ontrack = (event) => {
      console.log('📹 Remote track received:', event.streams[0]);
      setState(prev => ({ ...prev, remoteStream: event.streams[0] }));
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log('🔄 Connection failed, attempting to restart...');
        // Auto-restart logic could go here
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    return pc;
  }, [sendSignalingMessage]);

  const startVideoCall = useCallback(async (localStream: MediaStream) => {
    console.log('🎥 Starting video call with stream:', localStream);
    
    try {
      // Close existing connection if any
      if (peerConnectionRef.current) {
        console.log('🔄 Closing existing peer connection');
        peerConnectionRef.current.close();
      }

      // Clear queues and reset state
      iceCandidateQueueRef.current = [];
      pendingOfferRef.current = null;
      
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream tracks
      localStream.getTracks().forEach(track => {
        console.log(`➕ Adding track: ${track.kind}`);
        pc.addTrack(track, localStream);
      });

      setState(prev => ({ ...prev, isStreamingVideo: true }));

      // Create and send offer
      console.log('📤 Creating offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(offer);
      console.log('✅ Local description set, sending offer');
      
      await sendSignalingMessage('client-offer', offer);
      console.log('📤 Offer sent successfully');
      
    } catch (error) {
      console.error('❌ Error starting video call:', error);
      setState(prev => ({ 
        ...prev, 
        isStreamingVideo: false,
        error: 'Failed to start video call: ' + (error instanceof Error ? error.message : String(error))
      }));
    }
  }, [createPeerConnection, sendSignalingMessage]);

  const stopVideoCall = useCallback(() => {
    console.log('🛑 Stopping video call');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear queues
    iceCandidateQueueRef.current = [];
    pendingOfferRef.current = null;
    
    setState(prev => ({ ...prev, isStreamingVideo: false, remoteStream: null }));
    console.log('✅ Video call stopped');
  }, []);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    console.log('📥 Received offer (unexpected in contactWeb)');
    // contactWeb typically sends offers, doesn't receive them
    // But we can handle it for bidirectional calling if needed
  }, []);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    console.log('📥 Received answer');
    const pc = peerConnectionRef.current;
    
    if (!pc) {
      console.error('❌ No peer connection available for answer');
      return;
    }

    try {
      // Check signaling state before setting remote description
      if (pc.signalingState === 'have-local-offer') {
        console.log('✅ Setting remote description (answer)');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Process any queued ICE candidates now that we have remote description
        console.log(`🧊 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
        const candidates = [...iceCandidateQueueRef.current];
        iceCandidateQueueRef.current = [];
        
        for (const candidate of candidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ Added queued ICE candidate');
          } catch (error) {
            console.error('❌ Error adding queued ICE candidate:', error);
          }
        }
      } else {
        console.warn(`⚠️ Cannot set remote description, current state: ${pc.signalingState}`);
        // Store the answer for later if needed
        pendingOfferRef.current = answer;
      }
    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to process video call answer: ' + (error instanceof Error ? error.message : String(error))
      }));
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    console.log('📥 Received ICE candidate');
    const pc = peerConnectionRef.current;
    
    if (!pc) {
      console.error('❌ No peer connection available for ICE candidate');
      return;
    }

    try {
      if (pc.remoteDescription && pc.signalingState === 'stable') {
        console.log('✅ Adding ICE candidate immediately');
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log('⏳ Queuing ICE candidate (no remote description yet)');
        iceCandidateQueueRef.current.push(candidate);
      }
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }, []);

  const connect = useCallback(() => {
    try {
      console.log('🔌 Connecting to Pusher...');
      
      // Subscribe to transcription channel (audio functionality)
      channelRef.current = pusherClient.subscribe('transcription-channel');
      channelRef.current.bind('transcription-update', (data: any) => {
        console.log('🎤 TRANSCRIPTION RECEIVED via Pusher:', data.text);
        console.log('📝 Full data received:', data);
        
        // Handle emergency call results from server-side analysis
        if (data.emergencyCall && data.emergencyCall.success && data.emergencyCall.callSid) {
          console.log('🚨 EMERGENCY CALL TRIGGERED BY AI ANALYSIS:', data.emergencyCall);
          setState(prev => ({ 
            ...prev, 
            transcription: data.text || data.transcription || '',
            analysis: data.analysis || null,
            emergencyCall: data.emergencyCall,
            callInitiated: true,
            callSid: data.emergencyCall.callSid, // Set callSid for audio streaming
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            transcription: data.text || data.transcription || '',
            analysis: data.analysis || null,
            emergencyCall: data.emergencyCall || null,
          }));
        }
      });

      // Subscribe to video channel (completely independent signaling)
      videoChannelRef.current = pusherClient.subscribe('private-video-channel');
      videoChannelRef.current.bind('client-answer', handleAnswer);
      videoChannelRef.current.bind('client-ice-candidate', handleIceCandidate);
      videoChannelRef.current.bind('client-offer', handleOffer);

      // Connection event handlers
      pusherClient.connection.bind('connected', () => {
        console.log('✅ Pusher connected');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      });
      
      pusherClient.connection.bind('disconnected', () => {
        console.log('🔌 Pusher disconnected');
        setState(prev => ({ ...prev, isConnected: false }));
      });
      
      pusherClient.connection.bind('error', (error: any) => {
        console.error('❌ Pusher connection error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to connect to communication service', 
          isConnected: false 
        }));
      });
      
    } catch (error) {
      console.error('❌ Error setting up Pusher:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize communication service', 
        isConnected: false 
      }));
    }
  }, [handleAnswer, handleIceCandidate, handleOffer]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from Pusher...');
    
    if (channelRef.current) {
      pusherClient.unsubscribe('transcription-channel');
      channelRef.current = null;
    }
    
    if (videoChannelRef.current) {
      pusherClient.unsubscribe('private-video-channel');
      videoChannelRef.current = null;
    }
    
    stopVideoCall();
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isRecording: false,
      transcription: '',
      analysis: null,
      emergencyCall: null,
      error: null,
      callInitiated: false,
      callSid: null,
      isStreamingVideo: false,
      remoteStream: null,
    }));
  }, [stopVideoCall]);

  // Audio processing (independent of video)
  const sendAudioData = useCallback(async (audioData: ArrayBuffer | Blob) => {
    try {
      const blob = audioData instanceof ArrayBuffer ? new Blob([audioData]) : audioData;
      let format = 'webm';
      
      if (blob.type) {
        if (blob.type.includes('webm')) format = 'webm';
        else if (blob.type.includes('wav')) format = 'wav';
        else if (blob.type.includes('ogg')) format = 'ogg';
        else if (blob.type.includes('mp3')) format = 'mp3';
        else if (blob.type.includes('m4a')) format = 'm4a';
        else if (blob.type.includes('mp4')) format = 'mp4';
      }

      if (isFirstChunkRef.current) {
        console.log('🎤 Sending first audio chunk...');
        isFirstChunkRef.current = false;
      }

      // Convert blob to base64 for JSON transmission
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get just the base64 data
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64AudioData = await base64Promise;

      // Send to audio transcription service (independent of video)
      const response = await fetch('/api/pusher/audio', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioData: base64AudioData,
          format: format
        }),
      });

      if (!response.ok) {
        throw new Error(`Audio API response: ${response.status}`);
      }

      // Send to Twilio if call is active (also independent)
      if (state.callSid) {
        await sendAudioToTwilio(audioData);
      }

    } catch (error) {
      console.error('❌ Error sending audio data:', error);
      // Don't set error state for audio issues if video is working
      setState(prev => ({ 
        ...prev, 
        error: prev.isStreamingVideo ? null : 'Failed to process audio' 
      }));
    }
  }, [state.callSid, sendAudioToTwilio]);

  const startRecording = useCallback(() => {
    console.log('🎤 Starting audio recording...');
    isFirstChunkRef.current = true;
    setState(prev => ({ 
      ...prev, 
      isRecording: true, 
      transcription: '', 
      analysis: null, 
      error: null 
    }));
  }, []);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping audio recording...');
    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  const clearTranscription = useCallback(() => {
    setState(prev => ({ ...prev, transcription: '', analysis: null }));
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    sendAudioData,
    startRecording,
    stopRecording,
    clearTranscription,
    initiateEmergencyCall,
    startVideoCall,
    stopVideoCall,
  };
};