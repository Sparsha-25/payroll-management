/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Volume2, VolumeX, Sparkles, X, ChevronRight, MessageSquareCode } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  token: string;
}

export default function AIAssistant({ token }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Payroll & Employee Analytics Consultant. Ask me anything about department budgets, monthly trends, low attendance risk alerts, or high performers list!'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  
  const textEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Which department has highest payroll expense?',
    'Show employees with attendance below 75%',
    'Summarize IT vs Finance budget allocation',
    'Generate payroll report metrics overview'
  ];

  const scrollToBottom = () => {
    textEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!isSpeechEnabled) return;
    try {
      window.speechSynthesis.cancel();
      // Remove Markdown symbols before speech
      const cleanText = text.replace(/[*#`_\-]/g, '').slice(0, 150);
      const utterance = new SpeechSynthesisUtterance(cleanText);
       utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed', e);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isGenerating) return;

    if (!customText) {
      setInputMessage('');
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
        speakText(data.text);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Failed to analyze.'}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failure. Make sure your server is online.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        id="ai-floating-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-teal-600 hover:bg-teal-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-all duration-300 group border border-teal-400"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap text-sm">
          AI Consultant
        </span>
      </button>

      {/* Drawer Panel */}
      {isOpen && (
        <div
          id="ai-assistant-drawer"
          className="fixed top-0 right-0 h-full w-[450px] max-w-full bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-all duration-300 text-slate-100"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 flex items-center gap-1.5 leading-none">
                  AI Payroll Consultant
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded border border-teal-500/20">Live</span>
                </h3>
                <span className="text-xs text-slate-400">Powered by Gemini AI</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const active = !isSpeechEnabled;
                  setIsSpeechEnabled(active);
                  if (!active) window.speechSynthesis.cancel();
                }}
                className={`p-1.5 rounded-md hover:bg-slate-800 transition ${isSpeechEnabled ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400'}`}
                title="Toggle Speech Output"
              >
                {isSpeechEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900 leading-relaxed font-sans text-sm">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded bg-teal-600/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}
                <div
                  className={`p-3 max-w-[85%] rounded-lg border leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white border-teal-500 rounded-br-none'
                      : 'bg-slate-950 text-slate-200 border-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs font-sans font-medium">
                    {msg.content}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded bg-teal-600/20 text-teal-400 flex items-center justify-center shrink-0 animate-spin">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                  <span className="flex items-center gap-1">
                    Analyzing context and generating report...
                  </span>
                </div>
              </div>
            )}
            <div ref={textEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="p-3 bg-slate-950/60 border-t border-slate-800 space-y-2">
            <span className="text-slate-400 text-[10px] font-mono tracking-wider uppercase block">Instant Prompt Commands:</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((prompt, id) => (
                <button
                  key={id}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-[11px] bg-slate-800/80 hover:bg-teal-900/50 hover:text-teal-300 border border-slate-700 hover:border-teal-700 text-slate-300 px-2 py-1 rounded transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask for low attendance lists, salary predictions..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none placeholder-slate-500 text-slate-100"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isGenerating || !inputMessage.trim()}
              className="bg-teal-600 hover:bg-teal-500 text-white p-2.5 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-teal-600"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
