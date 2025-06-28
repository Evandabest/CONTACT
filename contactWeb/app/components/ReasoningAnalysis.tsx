'use client';

import React from 'react';
import { AlertTriangle, Brain, TrendingUp, TrendingDown, Activity, Clock, Target, MessageSquare } from 'lucide-react';

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

interface ReasoningAnalysisProps {
  analysis: ReasoningAnalysis;
  transcription: string;
  timestamp: number;
  isLive?: boolean;
}

const getEmergencyLevelColor = (level: string) => {
  switch (level) {
    case 'none':
      return 'bg-green-500';
    case 'low':
      return 'bg-yellow-500';
    case 'medium':
      return 'bg-orange-500';
    case 'high':
      return 'bg-red-500';
    case 'critical':
      return 'bg-red-600 animate-pulse';
    default:
      return 'bg-gray-500';
  }
};

const getEmergencyLevelText = (level: string) => {
  switch (level) {
    case 'none':
      return 'No Emergency';
    case 'low':
      return 'Low Priority';
    case 'medium':
      return 'Medium Priority';
    case 'high':
      return 'High Priority';
    case 'critical':
      return 'CRITICAL';
    default:
      return 'Unknown';
  }
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'neutral':
      return <Activity className="w-4 h-4 text-blue-500" />;
    case 'negative':
      return <TrendingDown className="w-4 h-4 text-orange-500" />;
    case 'distressed':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'text-green-500';
    case 'neutral':
      return 'text-blue-500';
    case 'negative':
      return 'text-orange-500';
    case 'distressed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export default function ReasoningAnalysis({ analysis, transcription, timestamp, isLive = false }: ReasoningAnalysisProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">AI Reasoning Analysis</h3>
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-400 font-medium">LIVE</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">{formatTime(timestamp)}</span>
        </div>
      </div>

      {/* Emergency Level Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Emergency Level</span>
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getEmergencyLevelColor(analysis.emergencyLevel)}`}>
            {getEmergencyLevelText(analysis.emergencyLevel)}
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Sentiment</span>
          <div className="flex items-center space-x-2">
            {getSentimentIcon(analysis.sentiment)}
            <span className={`text-sm font-medium capitalize ${getSentimentColor(analysis.sentiment)}`}>
              {analysis.sentiment}
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Confidence</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysis.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-300">{(analysis.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Context */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Context</h4>
        <p className="text-sm text-gray-200 bg-black/20 rounded p-3">
          {analysis.context}
        </p>
      </div>

      {/* Keywords */}
      {analysis.keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Key Indicators</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Required */}
      {analysis.actionRequired && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Action Required</span>
          </div>
          {analysis.suggestedActions.length > 0 && (
            <div className="space-y-1">
              {analysis.suggestedActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-red-400 text-xs mt-1">•</span>
                  <span className="text-sm text-red-300">{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reasoning */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">AI Reasoning</h4>
        <p className="text-sm text-gray-200 bg-black/20 rounded p-3 leading-relaxed">
          {analysis.reasoning}
        </p>
      </div>

      {/* Original Transcription */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-medium text-gray-300">Original Transcription</h4>
        </div>
        <p className="text-sm text-gray-200 bg-black/20 rounded p-3 italic">
          "{transcription}"
        </p>
      </div>
    </div>
  );
} 