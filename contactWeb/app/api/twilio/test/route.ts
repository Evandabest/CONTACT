import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
      return NextResponse.json({
        success: false,
        error: 'Missing Twilio environment variables',
        missing: {
          accountSid: !accountSid,
          authToken: !authToken,
          phoneNumber: !twilioNumber
        }
      }, { status: 400 });
    }

    // Test Twilio client initialization
    const client = twilio(accountSid, authToken);

    // Get account info to verify credentials
    const account = await client.api.accounts(accountSid).fetch();

    return NextResponse.json({
      success: true,
      message: 'Twilio configuration is valid',
      account: {
        sid: account.sid,
        name: account.friendlyName,
        status: account.status,
        phoneNumber: twilioNumber
      }
    });

  } catch (error) {
    console.error('Twilio test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to verify Twilio configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 