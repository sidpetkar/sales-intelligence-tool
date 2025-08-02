'use client';

import { Mail, Flame, Clock, Edit, BarChart3, Brain, ArrowUp, Paperclip } from 'lucide-react';
import { useState, useRef, FormEvent } from 'react';
import { extractSalesKeywords } from '../utils/sales-keywords';

interface HomePageProps {
  onPromptClick: (prompt: string) => void;
  onSubmit: (input: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
}

export default function HomePage({ onPromptClick, onSubmit, inputValue, setInputValue, isLoading }: HomePageProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const keywords = extractSalesKeywords(inputValue);
    const query = keywords.join(' ');
    
    onSubmit(query);
  };
  const quickActions = [
    {
      icon: Mail,
      title: 'Email Analysis',
      description: 'Analyze recent emails for sales opportunities',
      prompt: 'Analyze recent emails for sales opportunities'
    },
    {
      icon: Flame,
      title: 'Hot Leads',
      description: 'Show me my hottest prospects right now',
      prompt: 'Show me my hottest prospects right now'
    },
    {
      icon: Clock,
      title: 'Follow-ups',
      description: 'Review pending follow-up actions',
      prompt: 'Review pending follow-up actions'
    },
    {
      icon: Edit,
      title: 'Draft Email',
      description: 'Help me write a personalized email',
      prompt: 'Help me write a personalized email'
    },
    {
      icon: BarChart3,
      title: 'Pipeline Review',
      description: 'Analyze my sales pipeline performance',
      prompt: 'Analyze my sales pipeline performance'
    },
    {
      icon: Brain,
      title: 'AI Insights',
      description: 'Get smart recommendations for today',
      prompt: 'Get smart recommendations for today'
    }
  ];

  const suggestedPrompts = [
    "Show today's priorities",
    "Analyze Sarah Johnson emails",
    "Draft follow-up email",
    "Pipeline summary"
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full bg-gray-50 dark:bg-[#161616] px-4">
      {/* Welcome Header */}
      <div className="text-center mb-16">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img 
            src="/assets/logo.svg" 
            alt="Sales Intelligence Tool Logo" 
            className="w-16 h-16"
          />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-normal text-gray-900 dark:text-[#F9FAFB] mb-4">
          Welcome to Sales Intelligent Tool
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg text-gray-600 dark:text-[#A6A6A6] max-w-md mx-auto">
          Your intelligent sales assistant ready to help you close more deals
        </p>
      </div>

      {/* Input Box */}
      <div className="w-full max-w-4xl mb-16">
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div 
            className="p-3 flex flex-col gap-2 bg-gray-100 dark:bg-[#1E1E1E] shadow-sm border border-gray-200 dark:border-[#2F2F2E] rounded-3xl"
          >
            <div className="flex items-start gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your sales pipeline, leads, or need help with emails..."
                disabled={isLoading}
                className="flex-grow bg-transparent focus:outline-none text-gray-900 dark:text-[#F9FAFB] text-base placeholder-gray-500 dark:placeholder-[#A6A6A6] resize-none overflow-y-auto pr-2 min-h-[46px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (e.currentTarget.form) {
                      e.currentTarget.form.requestSubmit();
                    }
                  }
                }}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onPromptClick(prompt)}
                    className="text-xs px-2 py-1 rounded-full transition-colors bg-gray-100 dark:bg-[#292929] text-gray-700 dark:text-[#F9FAFB] hover:bg-gray-200 dark:hover:bg-[#1E1E1E] focus:outline-none"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className={`p-2 rounded-full transition-all duration-200 send-button ${
                    inputValue.trim() && !isLoading
                      ? 'bg-neutral-800 dark:bg-white text-white dark:text-black hover:bg-neutral-900 dark:hover:bg-gray-200'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  title="Send message"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16 max-w-4xl w-full">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => onPromptClick(action.prompt)}
              className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2F2F2E] rounded-3xl p-4 text-left transition-colors group hover:bg-gray-100 dark:hover:bg-[#292929] focus:outline-none"
            >
              {/* Icon and Title */}
              <div className="flex items-center mb-3">
                <IconComponent className="w-4 h-4 text-gray-900 dark:text-[#F9FAFB] mr-3" />
                <h3 className="text-base font-normal text-gray-900 dark:text-[#F9FAFB]">
                  {action.title}
                </h3>
              </div>
              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-[#A6A6A6] leading-normal">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
} 