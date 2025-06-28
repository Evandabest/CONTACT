'use client';

import { useState } from 'react';
import { Brain, Send, RotateCcw } from 'lucide-react';
import ReasoningAnalysis from '../components/ReasoningAnalysis';

const sampleTranscriptions = [
  "Help! I need emergency assistance immediately. There's been an accident and someone is injured.",
  "Everything is fine here, just checking in with the weather service.",
  "I'm feeling very distressed and need someone to talk to right now.",
  "The weather is beautiful today, perfect for a walk in the park.",
  "There's a fire in the building! Everyone needs to evacuate immediately!",
  "I'm lost in the woods and it's getting dark. I don't know where I am.",
  "Just wanted to report that the traffic lights are working properly now.",
  "I think I'm having a heart attack. Please send help quickly.",
  "The children are playing safely in the backyard, everything is normal.",
  "There's been a car crash on the highway. Multiple vehicles involved."
];

export default function TestReasoningPage() {
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeTranscription = async (text: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/reasoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: text,
          context: 'Test analysis - Emergency response system'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
        console.log('🧠 Analysis completed:', result.analysis);
      } else {
        setError(result.error || 'Analysis failed');
        console.error('❌ Analysis failed:', result.error);
      }
    } catch (error) {
      setError('Failed to analyze transcription');
      console.error('❌ Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcription.trim()) {
      analyzeTranscription(transcription.trim());
    }
  };

  const handleSampleClick = (sample: string) => {
    setTranscription(sample);
    setAnalysis(null);
    setError('');
  };

  const clearAll = () => {
    setTranscription('');
    setAnalysis(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Reasoning Analysis Test</h1>
          <p className="text-blue-100">
            Test the emergency response reasoning system with sample transcriptions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Transcription Input */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Enter Transcription</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder="Enter emergency transcription text here..."
                  className="w-full h-32 px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none text-gray-800 placeholder-gray-500 resize-none"
                />
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading || !transcription.trim()}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Brain className="w-5 h-5" />
                    <span>{loading ? 'Analyzing...' : 'Analyze with AI'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={clearAll}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Sample Transcriptions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Sample Transcriptions</h3>
              <div className="space-y-2">
                {sampleTranscriptions.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(sample)}
                    className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <p className="text-gray-200 text-sm leading-relaxed">
                      "{sample}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {analysis ? (
              <ReasoningAnalysis
                analysis={analysis}
                transcription={transcription}
                timestamp={Date.now()}
                isLive={false}
              />
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-center text-white/60">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                  <p className="text-sm">
                    Enter a transcription and click "Analyze with AI" to see the reasoning results
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/60">
          <p className="text-sm">
            This test page demonstrates the AI reasoning capabilities for emergency response analysis.
          </p>
        </div>
      </div>
    </div>
  );
} 