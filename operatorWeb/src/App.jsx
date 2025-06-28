import { useState } from 'react'
import './App.css'

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
      <header className="header">
        <h1>Operator Dashboard</h1>
      </header>
      <main className="main-content">
        <section className="twilio-feed">
          <h2 className="feed-title">Live Call Feed</h2>
          <div className="video-container">
            <span>Twilio video and audio feed will appear here.</span>
          </div>
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
