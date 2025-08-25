'use client';

import { useState, useEffect, useRef } from 'react';
import { usePusher } from '../hooks/usePusher';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useCamera } from '../hooks/useCamera';
import { Mic, MicOff, CheckCircle, XCircle, AlertTriangle, Video, VideoOff } from 'lucide-react';

export default function TestPusherPage() {
  const [tapCount, setTapCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const {
    isConnected,
    isRecording,
    transcription,
    analysis,
    emergencyCall,
    error: pusherError,
    sendAudioData,
    startRecording: pusherStartRecording,
    stopRecording: pusherStopRecording,
    clearTranscription,
    isStreamingVideo,
    remoteStream,
    startVideoCall,
    stopVideoCall,
  } = usePusher();

  const {
    isRecording: isAudioRecording,
    isSupported: isAudioSupported,
    hasPermission: hasAudioPermission,
    error: audioError,
    startRecording: audioStartRecording,
    stopRecording: audioStopRecording,
    requestPermission: requestAudioPermission,
  } = useAudioRecorder(sendAudioData);

  const {
    stream: localStream,
    error: cameraError,
    isStreaming: isCameraStreaming,
    requestPermission: requestCameraPermission,
    startStreaming: startCameraStreaming,
    stopStreaming: stopCameraStreaming,
  } = useCamera();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleTap = () => {
    setTapCount(prev => prev + 1);
    
    // Reset tap count after 2 seconds
    setTimeout(() => setTapCount(0), 2000);
    
    // Start recording on 3 taps
    if (tapCount === 2) {
      if (isRecording) {
        showToastMessage('Already recording!', 'error');
        return;
      }
      
      showToastMessage('Starting recording...', 'success');
      
      // Start recording with a slight delay
      setTimeout(() => {
        pusherStartRecording();
        audioStartRecording();
      }, 1000);
    }
  };

  const handleStopTap = () => {
    if (!isRecording) {
      showToastMessage('Not currently recording!', 'error');
      return;
    }
    
    showToastMessage('Stopping recording...', 'info');
    
    // Stop recording
    audioStopRecording();
    pusherStopRecording();
    clearTranscription();
  };

  const handleStartVideo = async () => {
    const stream = await startCameraStreaming();
    if (stream) {
      startVideoCall(stream);
    }
  };

  const handleStopVideo = () => {
    stopVideoCall();
    stopCameraStreaming();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Pusher Test Page
        </h1>

        {/* Connection Status */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Connection Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white">Pusher Connected:</span>
              <div className="flex items-center">
                {isConnected ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white">Audio Supported:</span>
              <div className="flex items-center">
                {isAudioSupported ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white">Audio Permission:</span>
              <div className="flex items-center">
                {hasAudioPermission ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white">Currently Recording:</span>
              <div className="flex items-center">
                {isRecording ? (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-red-200">Recording</span>
                  </div>
                ) : (
                  <span className="text-gray-300">Not Recording</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Controls</h2>
          
          <div className="space-y-4">
            {!hasAudioPermission && (
              <button
                onClick={requestAudioPermission}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Request Audio Permission
              </button>
            )}
            {!localStream && (
              <button
                onClick={requestCameraPermission}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Request Camera Permission
              </button>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={handleTap}
                disabled={!hasAudioPermission || isRecording}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start ({tapCount}/3)
              </button>
              
              <button
                onClick={handleStopTap}
                disabled={!isRecording}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <MicOff className="h-5 w-5 mr-2" />
                Stop
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleStartVideo}
                disabled={isStreamingVideo || !localStream}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Video className="h-5 w-5 mr-2" />
                Start Video
              </button>
              
              <button
                onClick={handleStopVideo}
                disabled={!isStreamingVideo}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <VideoOff className="h-5 w-5 mr-2" />
                Stop Video
              </button>
            </div>
          </div>
        </div>

        {/* Video Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <h3 className="text-lg font-bold text-white mb-2">Local Video</h3>
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded-lg"></video>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <h3 className="text-lg font-bold text-white mb-2">Remote Video</h3>
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg"></video>
            </div>
        </div>

        {/* Transcription Display */}
        {transcription && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Transcription</h2>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white">{transcription}</p>
            </div>
          </div>
        )}

        {/* Analysis Display */}
        {analysis && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Analysis</h2>
            <div className="bg-white/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white">Emergency Level:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  analysis.emergencyLevel === 'critical' ? 'bg-red-500 text-white' :
                  analysis.emergencyLevel === 'high' ? 'bg-orange-500 text-white' :
                  analysis.emergencyLevel === 'medium' ? 'bg-yellow-500 text-black' :
                  analysis.emergencyLevel === 'low' ? 'bg-blue-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {analysis.emergencyLevel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Sentiment:</span>
                <span className="text-blue-200">{analysis.sentiment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Confidence:</span>
                <span className="text-blue-200">{(analysis.confidence * 100).toFixed(1)}%</span>
              </div>
              {analysis.actionRequired && (
                <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                    <span className="text-yellow-200 text-sm">Action Required</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {(pusherError || audioError || cameraError) && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
            <h3 className="text-red-200 font-bold mb-2">Errors</h3>
            {pusherError && (
              <div className="flex items-center mb-2">
                <XCircle className="h-4 w-4 text-red-400 mr-2" />
                <span className="text-red-200 text-sm">Pusher: {pusherError}</span>
              </div>
            )}
            {audioError && (
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-400 mr-2" />
                <span className="text-red-200 text-sm">Audio: {audioError}</span>
              </div>
            )}
            {cameraError && (
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-400 mr-2" />
                <span className="text-red-200 text-sm">Camera: {cameraError}</span>
              </div>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            toastType === 'success' ? 'bg-green-500 text-white' :
            toastType === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
} 