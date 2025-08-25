import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioNumber) {
  console.error('Missing Twilio environment variables');
}

const client = twilio(accountSid!, authToken!);

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Twilio API endpoint called');
    const { to, message, callSid } = await request.json();
    console.log('📞 Request data:', { to, message, callSid });

    if (!to) {
      console.log('❌ No phone number provided');
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!twilioNumber) {
      console.log('❌ Twilio phone number not configured');
      return NextResponse.json({ error: 'Twilio phone number not configured' }, { status: 500 });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to)) {
      console.log('❌ Invalid phone number format:', to);
      return NextResponse.json({ 
        error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' 
      }, { status: 400 });
    }

    console.log('✅ Phone number validation passed:', to);

    // Make the call
    console.log('📞 Creating Twilio call...');
    const call = await client.calls.create({
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/twilio/voice`,
      to: to,
      from: twilioNumber,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    console.log('✅ Twilio call initiated:', {
      callSid: call.sid,
      to,
      from: twilioNumber,
      status: call.status
    });

    return NextResponse.json({ 
      success: true, 
      callSid: call.sid,
      status: call.status 
    });

  } catch (error) {
    console.error('❌ Twilio call error:', error);
    
    // Handle specific Twilio errors
    if (error instanceof Error) {
      if (error.message.includes('not a valid phone number')) {
        return NextResponse.json({ 
          error: 'Invalid phone number format',
          details: 'Please use international format (e.g., +1234567890)'
        }, { status: 400 });
      }
      
      if (error.message.includes('insufficient funds')) {
        return NextResponse.json({ 
          error: 'Insufficient Twilio account balance',
          details: 'Please add funds to your Twilio account'
        }, { status: 402 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to initiate call',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Twilio API endpoint' });
} 