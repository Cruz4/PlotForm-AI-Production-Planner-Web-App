
'use client';

import type { AppMode, EpisodeStatus, Episode } from '@/types';
import { Brain, CalendarClock, Edit, CheckCircle, Archive, Hourglass, ClipboardCheck, ThumbsUp, StickyNote } from 'lucide-react';
import React from 'react';

export const getStatusVisualsForCard = (
  status: EpisodeStatus,
  currentMode: AppMode,
  customLabels?: Episode['customStatusLabels']
): { text: string; icon: React.ReactNode; colorClasses: string; } => {
  const workflow = currentMode.statusWorkflow;
  switch (status) {
    case 'planning': return { 
        text: workflow.planning.label, 
        icon: <Brain className="h-3 w-3 mr-1.5" />, 
        colorClasses: 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-300 border-yellow-500/30'
    };
    case 'scheduled': return { 
        text: customLabels?.scheduled || workflow.scheduled.label, 
        icon: <CalendarClock className="h-3 w-3 mr-1.5" />, 
        colorClasses: 'bg-blue-400/20 text-blue-600 dark:text-blue-300 border-blue-500/30'
    };
    case 'editing': return { 
        text: customLabels?.editing || workflow.editing.label, 
        icon: <Edit className="h-3 w-3 mr-1.5" />, 
        colorClasses: 'bg-orange-400/20 text-orange-600 dark:text-orange-300 border-orange-500/30'
    };
    case 'published': return { 
        text: customLabels?.published || workflow.published.label, 
        icon: <CheckCircle className="h-3 w-3 mr-1.5" />, 
        colorClasses: 'bg-green-400/20 text-green-600 dark:text-green-300 border-green-500/30'
    };
    case 'archived': return { 
        text: "Archived", 
        icon: <Archive className="h-3 w-3 mr-1.5" />, 
        colorClasses: 'bg-gray-400/20 text-gray-600 dark:text-gray-300 border-gray-500/30'
    };
    default: return { 
        text: 'Unknown', 
        icon: <Hourglass className="h-3 w-3 mr-1.5" />, 
        colorClasses: 'bg-gray-400/20 text-gray-600 dark:text-gray-300 border-gray-500/30'
    };
  }
};
