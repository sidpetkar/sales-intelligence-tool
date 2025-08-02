'use client';

import { Mail, Clock } from 'lucide-react';

interface EmailCardProps {
  name: string;
  company?: string;
  email: string;
  timestamp: string;
  subject: string;
  content: string;
  tags?: {
    budget?: string;
    timeline?: string;
    decisionMaker?: string;
    priority?: string;
  };
  emailCount?: number;
  followUpDays?: number;
  timeAgo?: string;
}

export default function EmailCard({
  name,
  company,
  email,
  timestamp,
  subject,
  content,
  tags,
  emailCount = 1,
  followUpDays,
  timeAgo = "2 hours ago"
}: EmailCardProps) {
  // Generate avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get first name from full name
  const getFirstName = (name: string) => {
    return name.split(' ')[0];
  };

  // Generate avatar background color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get priority tag styling based on lead temperature
  const getPriorityTagStyle = (priority: string) => {
    switch (priority) {
      case 'Hot Lead':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'Warm Lead':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'Cold Lead':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-[#292929] text-gray-800 dark:text-[#F9FAFB]';
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2F2F2E] rounded-3xl p-6 w-full max-w-4xl">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(name)} flex items-center justify-center text-white font-medium text-sm`}>
            {getInitials(name)}
          </div>
          
          {/* Contact Info */}
          <div className="flex-1">
            <h3 className="text-gray-900 dark:text-[#F9FAFB] font-normal text-base leading-6">
              {name}{company && ` - ${company}`}
            </h3>
            <p className="text-gray-600 dark:text-[#A6A6A6] text-sm leading-5">
              {email} • Date: {timestamp}
            </p>
          </div>
        </div>

        {/* Right side - Priority tag and time */}
        <div className="flex items-center gap-2">
          {tags?.priority && (
            <span className={`${getPriorityTagStyle(tags.priority)} text-xs font-normal px-2 py-1 rounded-full`}>
              {tags.priority}
            </span>
          )}
          <span className="text-gray-500 dark:text-[#A6A6A6] text-sm">
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-[#F9FAFB] text-base leading-6 mb-4">
          {content}
        </p>

        {/* Tags */}
        {(tags?.budget || tags?.timeline || tags?.decisionMaker) && (
          <div className="flex flex-wrap gap-2">
            {tags.budget && (
              <span className="bg-gray-100 dark:bg-[#292929] text-gray-700 dark:text-[#F9FAFB] text-xs px-2 py-1 rounded">
                Budget: {tags.budget}
              </span>
            )}
            {tags.timeline && (
              <span className="bg-gray-100 dark:bg-[#292929] text-gray-700 dark:text-[#F9FAFB] text-xs px-2 py-1 rounded">
                Timeline: {tags.timeline}
              </span>
            )}
            {tags.decisionMaker && (
              <span className="bg-gray-100 dark:bg-[#292929] text-gray-700 dark:text-[#F9FAFB] text-xs px-2 py-1 rounded">
                Decision Maker: {tags.decisionMaker}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Email count */}
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-600 dark:text-[#A6A6A6]" />
            <span className="text-gray-600 dark:text-[#A6A6A6] text-sm">
              {emailCount} email{emailCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Follow up */}
          {followUpDays && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600 dark:text-[#A6A6A6]" />
              <span className="text-gray-600 dark:text-[#A6A6A6] text-sm">
                Follow up in {followUpDays} days
              </span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button className="bg-transparent border border-gray-300 dark:border-[#2F2F2E] text-gray-800 dark:text-[#F9FAFB] text-sm px-4 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-[#292929] transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
} 