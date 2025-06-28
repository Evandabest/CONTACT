import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_ANON_OPENAI_KEY,
});

interface ReasoningAnalysis {
  emergencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  context: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'distressed';
  actionRequired: boolean;
  suggestedActions: string[];
  confidence: number;
  reasoning: string;
}

export async function POST(req: NextRequest) {
  try {
    const { transcription, context = '', previousAnalysis = null } = await req.json();

    if (!transcription || typeof transcription !== 'string') {
      return NextResponse.json(
        { error: 'No transcription text provided' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_ANON_OPENAI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🧠 Starting reasoning analysis...');
    console.log('📝 Transcription:', transcription);
    console.log('📋 Context:', context);

    // Create a comprehensive prompt for reasoning analysis
    const systemPrompt = `You are an emergency response AI assistant analyzing live audio transcriptions from emergency situations. Your role is to:

1. Analyze the content for emergency indicators
2. Assess the urgency level
3. Identify key context and keywords
4. Determine if immediate action is required
5. Provide reasoning for your analysis

EMERGENCY LEVELS:
- none: No emergency indicators
- low: Minor concerns, monitoring recommended
- medium: Moderate concerns, attention needed
- high: Serious concerns, immediate attention required
- critical: Life-threatening situation, emergency response needed

SENTIMENT LEVELS:
- positive: Calm, positive, or helpful communication
- neutral: Normal conversation
- negative: Distressed, angry, or concerning communication
- distressed: Panic, fear, or extreme distress

Respond with a JSON object containing:
{
  "emergencyLevel": "none|low|medium|high|critical",
  "context": "Brief description of the situation",
  "keywords": ["key", "words", "identified"],
  "sentiment": "positive|neutral|negative|distressed",
  "actionRequired": true|false,
  "suggestedActions": ["action1", "action2"],
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of your analysis"
}`;

    const userPrompt = `Analyze this live transcription from an emergency situation:

TRANSCRIPTION: "${transcription}"

CONTEXT: ${context || 'Live audio from emergency response system'}

${previousAnalysis ? `PREVIOUS ANALYSIS: ${JSON.stringify(previousAnalysis)}` : ''}

Please provide a comprehensive analysis focusing on emergency indicators, urgency, and required actions.`;

    console.log('🤖 Sending to OpenAI for reasoning analysis...');

    // Use OpenAI's reasoning capabilities
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent reasoning
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content received from OpenAI');
    }

    let analysis: ReasoningAnalysis;
    try {
      analysis = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from reasoning analysis');
    }

    // Validate the analysis structure
    if (!analysis.emergencyLevel || !analysis.context || !analysis.reasoning) {
      throw new Error('Incomplete analysis response');
    }

    console.log('✅ REASONING ANALYSIS COMPLETE!');
    console.log('🚨 Emergency Level:', analysis.emergencyLevel);
    console.log('📊 Sentiment:', analysis.sentiment);
    console.log('🎯 Action Required:', analysis.actionRequired);
    console.log('🔍 Keywords:', analysis.keywords);
    console.log('💭 Reasoning:', analysis.reasoning);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      timestamp: Date.now(),
      transcription: transcription
    });

  } catch (error) {
    console.error('Reasoning analysis error:', error);
    
    let errorMessage = 'Failed to analyze transcription';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ hello: 'world' });
} 