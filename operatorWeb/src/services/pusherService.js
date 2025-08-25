import Pusher from 'pusher-js';

// IMPORTANT: The operatorWeb vite dev server runs on a different port than the contactWeb server.
// We must provide the full URL to the auth endpoint on the contactWeb server.
// In production, this should be your production URL.
let contactWebUrl = import.meta.env.VITE_CONTACT_WEB_URL || 'http://localhost:3000';
if (contactWebUrl.endsWith('/')) {
  contactWebUrl = contactWebUrl.slice(0, -1);
}
const CONTACT_WEB_URL = contactWebUrl;

// Use environment variables
const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

class PusherService {
  constructor() {
    this.pusher = null;
    this.channel = null;
    this.peerConnection = null;
    this.onRemoteStream = null;
    this.onConnectionChange = null;
  }

  connect(onRemoteStream, onConnectionChange) {
    this.onRemoteStream = onRemoteStream;
    this.onConnectionChange = onConnectionChange;

    this.pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      authEndpoint: `${CONTACT_WEB_URL}/api/pusher/auth`,
    });

    this.channel = this.pusher.subscribe('private-video-channel');

    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to private-video-channel');
    });

    this.channel.bind('pusher:subscription_error', (status) => {
      console.error(`Pusher subscription error for private-video-channel: ${status}`);
    });

    this.channel.bind('client-offer', this.handleOffer.bind(this));
    this.channel.bind('client-answer', this.handleAnswer.bind(this));
    this.channel.bind('client-ice-candidate', this.handleIceCandidate.bind(this));

    this.pusher.connection.bind('connected', () => {
      console.log('Pusher connected on operatorWeb');
      if (this.onConnectionChange) this.onConnectionChange(true);
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('Pusher disconnected on operatorWeb');
      if (this.onConnectionChange) this.onConnectionChange(false);
    });

    this.pusher.connection.bind('error', (err) => {
      console.error('Pusher connection error on operatorWeb:', err);
      if (this.onConnectionChange) this.onConnectionChange(false);
    });
  }

  sendSignalingMessage(event, data) {
    // The operatorWeb does not send offers, only answers and ice-candidates
    // so we need a way to send these to the server to be relayed.
    // However, for client-events, we can trigger them directly.
    this.channel.trigger(event, data);
  }

  createPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage('client-ice-candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote track received on operatorWeb');
      if (this.onRemoteStream) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    return pc;
  }

  async handleOffer(offer) {
    console.log('Received offer on operatorWeb');
    this.peerConnection = this.createPeerConnection();
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.sendSignalingMessage('client-answer', answer);
    } catch (e) {
      console.error("Error creating answer in operatorWeb", e);
    }
  }

  async handleAnswer(answer) {
    // operatorWeb doesn't send offers, so it shouldn't receive answers.
    console.log('Received answer on operatorWeb (should not happen)', answer);
  }

  async handleIceCandidate(candidate) {
    console.log('Received ICE candidate on operatorWeb');
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  disconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.channel) {
      this.pusher.unsubscribe('private-video-channel');
      this.channel = null;
    }
    if(this.pusher) {
        this.pusher.disconnect();
        this.pusher = null;
    }
  }
}

export const pusherService = new PusherService(); 