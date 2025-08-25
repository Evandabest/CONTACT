import { useState, useEffect } from 'react'
import './App.css'
import LiveFeed from './components/LiveFeed'
import ServerConfig from './components/ServerConfig'

function App() {
  // Real camera data with URLs and names
  const [publicCameras, setPublicCameras] = useState([
    { 
      id: 1, 
      name: '6 Ave @ 23 St',
      url: 'https://webcams.nyctmc.org/api/cameras/fcc24aa5-4da0-48f2-aa43-e70e4677517c/image'
    },
    { 
      id: 2, 
      name: '7 Ave @ 23 St',
      url: 'https://webcams.nyctmc.org/api/cameras/fcfbaa3d-13e5-4687-9688-ae1eab37c723/image'
    },
    { 
      id: 3, 
      name: '5 Ave @ 23 St',
      url: 'https://webcams.nyctmc.org/api/cameras/3486cafa-aab2-418a-baa4-89dcc438e8c9/image'
    },
    { 
      id: 4, 
      name: '6 Ave @ 34 St',
      url: 'https://webcams.nyctmc.org/api/cameras/f06979b2-3497-4330-9882-a06c8a442b7c/image'
    }
  ]);

  // Add cache busting to force image refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPublicCameras(prevCameras => 
        prevCameras.map(camera => ({
          ...camera,
          url: `${camera.url.split('?')[0]}?t=${Date.now()}`
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <ServerConfig />
      <header className="header">
        <h1>Operator Dashboard</h1>
        <p className="subtitle">Emergency Response & Monitoring System</p>
      </header>
      <main className="main-content">
        <section className="emergency-feed">
          <h2 className="feed-title">Emergency Live Feed</h2>
          <LiveFeed />
        </section>
        <section className="public-feeds">
          <h2 className="feed-title">Nearby Public Cameras</h2>
          {publicCameras.length > 0 ? (
            <div className="camera-grid">
              {publicCameras.map(camera => (
                <div key={camera.id} className="video-container">
                  <img 
                    src={camera.url} 
                    alt={camera.name}
                    className="camera-feed"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="camera-error" style={{ display: 'none' }}>
                    <p>Camera feed unavailable</p>
                  </div>
                  <span className="camera-name">{camera.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-cameras">
              <p>No public cameras available nearby.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
