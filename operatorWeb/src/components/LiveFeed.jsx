import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import mediaService from '../services/mediaService';
import './LiveFeed.css';

function LiveFeed() {
  const [isConnected, setIsConnected] = useState(false);
  const [latestPhoto, setLatestPhoto] = useState(null);
  const [latestVideo, setLatestVideo] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const [mediaHistory, setMediaHistory] = useState({
    photos: [],
    videos: []
  });

  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    // Set up event listeners
    socketService.on('onConnect', () => {
      setIsConnected(true);
      setError('');
    });

    socketService.on('onDisconnect', () => {
      setIsConnected(false);
    });

    socketService.on('onPhotoReceived', (data) => {
      if (data.success) {
        setLatestPhoto({
          filename: data.filename,
          timestamp: data.timestamp,
          url: mediaService.getPhotoUrl(data.filename),
          isLiveStream: data.isLiveStream || false
        });
        // Refresh media history
        loadMediaHistory();
      }
    });

    socketService.on('onVideoReceived', (data) => {
      if (data.success) {
        setLatestVideo({
          filename: data.filename,
          timestamp: data.timestamp,
          url: mediaService.getVideoUrl(data.filename),
          isLiveStream: data.isLiveStream || false
        });
        // Refresh media history
        loadMediaHistory();
      }
    });

    socketService.on('onTranscriptionUpdate', (data) => {
      if (data.success && data.text) {
        setTranscription(prev => {
          const newTranscription = prev + '\n' + data.text;
          // Keep only last 10 lines to prevent memory issues
          const lines = newTranscription.split('\n');
          return lines.slice(-10).join('\n');
        });
        
        // Add live streaming indicator
        if (data.isLiveStream) {
          console.log('📝 Live transcription update:', data.text);
        }
      }
    });

    socketService.on('onError', (error) => {
      setError(`Connection error: ${error.message}`);
    });

    // Load initial media history
    loadMediaHistory();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadMediaHistory = async () => {
    try {
      const [photos, videos] = await Promise.all([
        mediaService.getPhotos(),
        mediaService.getVideos()
      ]);

      setMediaHistory({
        photos: photos.slice(0, 5), // Show last 5 photos
        videos: videos.slice(0, 3)  // Show last 3 videos
      });
    } catch (error) {
      console.error('Error loading media history:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="live-feed">
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="feed-content">
        {/* Latest Media Section */}
        <div className="latest-media">
          <h3>Latest Emergency Media</h3>
          
          {latestPhoto && (
            <div className="latest-item">
              <h4>
                Latest Photo
                {latestPhoto.isLiveStream && (
                  <span className="live-indicator"> 🔴 LIVE</span>
                )}
              </h4>
              <img 
                src={latestPhoto.url} 
                alt="Latest emergency photo"
                className="latest-photo"
              />
              <p className="timestamp">
                {formatTimestamp(latestPhoto.timestamp)}
                {latestPhoto.isLiveStream && (
                  <span className="live-timestamp"> • Live Stream</span>
                )}
              </p>
            </div>
          )}

          {latestVideo && (
            <div className="latest-item">
              <h4>
                Latest Video
                {latestVideo.isLiveStream && (
                  <span className="live-indicator"> 🔴 LIVE</span>
                )}
              </h4>
              <video 
                src={latestVideo.url} 
                controls
                className="latest-video"
              >
                Your browser does not support the video tag.
              </video>
              <p className="timestamp">
                {formatTimestamp(latestVideo.timestamp)}
                {latestVideo.isLiveStream && (
                  <span className="live-timestamp"> • Live Stream</span>
                )}
              </p>
            </div>
          )}

          {!latestPhoto && !latestVideo && (
            <div className="no-media">
              <p>No emergency media received yet.</p>
              <p>Waiting for mobile app to send data...</p>
            </div>
          )}
        </div>

        {/* Transcription Section */}
        {transcription && (
          <div className={`transcription-section ${transcription.includes('Live') ? 'live-streaming' : ''}`}>
            <h3>Live Transcription</h3>
            <div className="transcription-content">
              <pre>{transcription}</pre>
            </div>
          </div>
        )}

        {/* Media History Section */}
        <div className="media-history">
          <h3>Recent Media History</h3>
          
          {mediaHistory.photos.length > 0 && (
            <div className="history-section">
              <h4>Recent Photos</h4>
              <div className="photo-grid">
                {mediaHistory.photos.map((photo, index) => (
                  <div key={index} className="history-item">
                    <img 
                      src={mediaService.getPhotoUrl(photo.filename)} 
                      alt={`Photo ${index + 1}`}
                      className="history-photo"
                    />
                    <p className="timestamp">
                      {formatTimestamp(photo.created)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaHistory.videos.length > 0 && (
            <div className="history-section">
              <h4>Recent Videos</h4>
              <div className="video-list">
                {mediaHistory.videos.map((video, index) => (
                  <div key={index} className="history-item">
                    <video 
                      src={mediaService.getVideoUrl(video.filename)} 
                      controls
                      className="history-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <p className="timestamp">
                      {formatTimestamp(video.created)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaHistory.photos.length === 0 && mediaHistory.videos.length === 0 && (
            <div className="no-history">
              <p>No media history available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveFeed; 