import { useState } from 'react'
import './App.css'
import LiveFeed from './components/LiveFeed'
import ServerConfig from './components/ServerConfig'

function App() {
  // Mock data for public cameras.
  // To test the "no cameras" state, set this to an empty array: []
  const [publicCameras, setPublicCameras] = useState([
    { id: 1, name: 'Public Camera 1' },
    { id: 2, name: 'Public Camera 2' },
    { id: 3, name: 'Public Camera 3' },
  ]);

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
                  <span>{camera.name}</span>
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
