import { useState, useEffect, useRef } from 'react';
import { pusherService } from '../services/pusherService';
import './LiveFeed.css';

function LiveFeed() {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // Connect to pusher service for video streaming
    pusherService.connect(
      (stream) => setRemoteStream(stream),
      (status) => setIsConnected(status)
    );

    // Cleanup on unmount
    return () => {
      pusherService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="live-feed">
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected to Pusher' : '🔴 Disconnected from Pusher'}
        </div>
      </div>

      <div className="feed-content">
        <div className="latest-media">
          <h3>Live Video Stream</h3>
          
          {remoteStream ? (
            <div className="latest-item">
              <video 
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                className="latest-video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="no-media">
              <p>Waiting for live stream to start...</p>
              <p>{!isConnected ? "Connecting to stream service..." : "No video signal."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveFeed; 