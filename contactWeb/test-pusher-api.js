// Simple test script to verify Pusher API endpoint
// Run with: node test-pusher-api.js

const testPusherAPI = async () => {
  try {
    console.log('🧪 Testing Pusher API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/pusher/audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: 'dGVzdA==', // base64 encoded "test"
        format: 'webm'
      }),
    });
    
    const result = await response.json();
    console.log('📡 Response status:', response.status);
    console.log('📡 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Pusher API endpoint is working!');
    } else {
      console.log('❌ Pusher API endpoint returned error:', result);
    }
  } catch (error) {
    console.error('❌ Error testing Pusher API:', error.message);
    console.log('💡 Make sure the development server is running: npm run dev');
  }
};

// Test transcription API as well
const testTranscriptionAPI = async () => {
  try {
    console.log('\n🧪 Testing Transcription API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: 'dGVzdA==', // base64 encoded "test"
        format: 'webm'
      }),
    });
    
    const result = await response.json();
    console.log('📡 Response status:', response.status);
    console.log('📡 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Transcription API endpoint is working!');
    } else {
      console.log('❌ Transcription API endpoint returned error:', result);
    }
  } catch (error) {
    console.error('❌ Error testing Transcription API:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting API tests...\n');
  await testPusherAPI();
  await testTranscriptionAPI();
  console.log('\n✨ Tests completed!');
};

runTests(); 