import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;

    console.log('Twilio voice webhook received:', { callSid, callStatus });

    // Generate TwiML response for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Emergency call initiated. Please stay on the line to hear live audio from the emergency contact.</Say>
  <Pause length="2"/>
  <Say voice="alice">You will now hear live audio from the device.</Say>
  <Pause length="1"/>
  <Connect>
    <Stream url="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/twilio/audio-stream" />
  </Connect>
  <Pause length="3600"/>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Twilio voice webhook error:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error processing your call. Please try again.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Twilio voice endpoint' });
} 