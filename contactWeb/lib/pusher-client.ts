import Pusher from 'pusher-js';

// Ensure the key and cluster are correctly loaded from environment variables
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  throw new Error('Pusher key and cluster must be set in environment variables.');
}

export const pusherClient = new Pusher(pusherKey, {
  cluster: pusherCluster,
  forceTLS: true,
  // Add the authentication endpoint for private channels
  authEndpoint: '/api/pusher/auth',
}); 