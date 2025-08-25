// Utility functions and state for Twilio audio streaming

const activeStreams = new Map<string, any>();

export function sendAudioToStreams(audioData: ArrayBuffer) {
  console.log('📤 Sending audio to', activeStreams.size, 'active streams');
  activeStreams.forEach((controller, callSid) => {
    try {
      controller.enqueue(new Uint8Array(audioData));
      console.log('✅ Audio sent to call:', callSid);
    } catch (error) {
      console.error(`❌ Error sending audio to call ${callSid}:`, error);
      activeStreams.delete(callSid);
    }
  });
}

export function getActiveStreamCount() {
  return activeStreams.size;
}

export { activeStreams }; 