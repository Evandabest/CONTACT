# Twilio Integration Setup Guide

This guide will help you set up the Twilio integration for the emergency calling feature.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. A Twilio phone number
3. Node.js and npm installed

## Environment Variables

Create a `.env.local` file in the `contactWeb` directory with the following variables:

```env
# Existing environment variables
NEXT_PUBLIC_WEATHER_KEY=your_openweather_api_key_here
NEXT_ANON_OPENAI_KEY=your_openai_api_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Emergency Contact Number (hardcoded)
NEXT_PUBLIC_EMERGENCY_NUMBER=+1234567890

# Base URL for webhooks (update this for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Getting Twilio Credentials

1. **Account SID**: Found in your Twilio Console dashboard
2. **Auth Token**: Found in your Twilio Console dashboard (regenerate if needed)
3. **Phone Number**: Purchase a phone number in your Twilio Console

## Emergency Number Configuration

- **`NEXT_PUBLIC_EMERGENCY_NUMBER`**: This is the phone number that will receive emergency calls
- Format: Use international format (e.g., `+1234567890`)
- This number is hardcoded and cannot be changed through the UI
- Make sure this is a trusted contact number

## Twilio Console Configuration

1. Go to your Twilio Console
2. Navigate to Phone Numbers > Manage > Active numbers
3. Click on your phone number
4. In the "Voice & Fax" section, set the webhook URL to:
   - For development: `http://localhost:3000/api/twilio/voice`
   - For production: `https://yourdomain.com/api/twilio/voice`
5. Set the HTTP method to POST

## Installation

1. Install the new dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## How It Works

1. **Emergency Trigger**: Press the sunrise button 3 times to trigger an emergency call
2. **Call Initiation**: The system will call the hardcoded emergency number
3. **Audio Streaming**: Live audio from the whisper process is streamed to the called device
4. **Call End**: Press the sunset button 3 times to end the call and stop recording

## Features

- **Hardcoded Emergency Number**: Set once in environment variables
- **Live Audio Streaming**: Real-time audio transmission from the device to the called number
- **Call Status Tracking**: Monitor call status and connection
- **Error Handling**: Comprehensive error handling and user feedback

## Security Notes

- Keep your Twilio credentials secure
- Use environment variables for all sensitive data
- The emergency number should be a trusted contact number
- Consider implementing additional authentication for production use

## Troubleshooting

1. **Call not connecting**: Check your Twilio phone number configuration
2. **Audio not streaming**: Verify the webhook URLs are accessible
3. **Environment variables not loading**: Restart the development server after adding `.env.local`
4. **Wrong emergency number**: Update `NEXT_PUBLIC_EMERGENCY_NUMBER` in `.env.local`

## Production Deployment

For production deployment:

1. Update `NEXT_PUBLIC_BASE_URL` to your production domain
2. Configure Twilio webhooks to use your production URLs
3. Ensure your server is accessible via HTTPS
4. Set the correct emergency number for production
5. Consider implementing rate limiting and additional security measures 