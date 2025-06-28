import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import mediaService from '../services/mediaService';
import './ServerConfig.css';

function ServerConfig() {
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [isConnected, setIsConnected] = useState(false);
  const [serverHealth, setServerHealth] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleConnect = () => {
    socketService.disconnect();
    socketService.connect(serverUrl);
    
    // Update media service URL
    mediaService.baseUrl = serverUrl;
    
    // Check server health
    checkServerHealth();
  };

  const checkServerHealth = async () => {
    try {
      const isHealthy = await mediaService.checkServerHealth();
      setServerHealth(isHealthy);
    } catch (error) {
      setServerHealth(false);
    }
  };

  const handleDisconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
    setServerHealth(null);
  };

  // Listen for connection status changes
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.getConnectionStatus());
    };
    
    // Check initially
    checkConnection();
    
    // Set up interval to check connection status
    const interval = setInterval(checkConnection, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="server-config">
      <button 
        className="config-toggle"
        onClick={() => setShowConfig(!showConfig)}
      >
        ⚙️ Server Configuration
      </button>
      
      {showConfig && (
        <div className="config-panel">
          <div className="config-section">
            <label htmlFor="serverUrl">Server URL:</label>
            <input
              id="serverUrl"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </div>
          
          <div className="status-section">
            <div className="status-item">
              <span>Connection:</span>
              <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>
            
            {serverHealth !== null && (
              <div className="status-item">
                <span>Server Health:</span>
                <span className={`status ${serverHealth ? 'healthy' : 'unhealthy'}`}>
                  {serverHealth ? '🟢 Healthy' : '🔴 Unhealthy'}
                </span>
              </div>
            )}
          </div>
          
          <div className="action-buttons">
            <button 
              className="connect-btn"
              onClick={handleConnect}
              disabled={isConnected}
            >
              Connect
            </button>
            <button 
              className="disconnect-btn"
              onClick={handleDisconnect}
              disabled={!isConnected}
            >
              Disconnect
            </button>
            <button 
              className="health-btn"
              onClick={checkServerHealth}
            >
              Check Health
            </button>
          </div>
          
          <div className="info-section">
            <h4>Server Features:</h4>
            <ul>
              <li>📸 Real-time photo capture</li>
              <li>🎥 Video recording</li>
              <li>🎤 Audio transcription</li>
              <li>📡 WebSocket streaming</li>
              <li>💾 Media storage & retrieval</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServerConfig; 