import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;

    console.log('Twilio status callback:', {
      callSid,
      callStatus,
      callDuration,
      to,
      from
    });

    // Handle different call statuses
    switch (callStatus) {
      case 'initiated':
        console.log(`Call ${callSid} initiated to ${to}`);
        break;
      case 'ringing':
        console.log(`Call ${callSid} is ringing at ${to}`);
        break;
      case 'answered':
        console.log(`Call ${callSid} was answered by ${to}`);
        break;
      case 'completed':
        console.log(`Call ${callSid} completed. Duration: ${callDuration} seconds`);
        break;
      case 'busy':
        console.log(`Call ${callSid} was busy at ${to}`);
        break;
      case 'failed':
        console.log(`Call ${callSid} failed to ${to}`);
        break;
      case 'no-answer':
        console.log(`Call ${callSid} was not answered at ${to}`);
        break;
      default:
        console.log(`Call ${callSid} status: ${callStatus}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Twilio status callback error:', error);
    return NextResponse.json({ error: 'Failed to process status callback' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Twilio status callback endpoint' });
} 