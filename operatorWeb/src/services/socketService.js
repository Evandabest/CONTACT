import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.callbacks = {
      onConnect: [],
      onDisconnect: [],
      onTranscriptionUpdate: [],
      onPhotoReceived: [],
      onVideoReceived: [],
      onError: []
    };
  }

  connect(serverUrl = 'http://localhost:3001') {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to server:', serverUrl);
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.isConnected = true;
      this.callbacks.onConnect.forEach(callback => callback());
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.isConnected = false;
      this.callbacks.onDisconnect.forEach(callback => callback());
    });

    this.socket.on('transcriptionUpdate', (data) => {
      console.log('📝 Transcription update:', data);
      this.callbacks.onTranscriptionUpdate.forEach(callback => callback(data));
    });

    this.socket.on('photoReceived', (data) => {
      console.log('📸 Photo received:', data);
      this.callbacks.onPhotoReceived.forEach(callback => callback(data));
    });

    this.socket.on('videoReceived', (data) => {
      console.log('🎥 Video received:', data);
      this.callbacks.onVideoReceived.forEach(callback => callback(data));
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.callbacks.onError.forEach(callback => callback(error));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService; 