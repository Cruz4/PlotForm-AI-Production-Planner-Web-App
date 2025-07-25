
'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, RefreshCw, X, ArrowRight } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAppContextMode } from '@/contexts/ModeContext';
import type { Episode, Segment, EpisodeStatus, AppMode } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomHost1Name } from '@/lib/episodeLayoutsStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { calculateGenericEpisodeStatus, areAllHost1SegmentsFilledForCard } from '@/lib/dataUtils';


const getSegmentProgress = (episode: Episode): { completed: number; total: number; } => {
    if (!episode.segments || episode.segments.length === 0) return { completed: 0, total: 0 };
    const total = episode.segments.length;
    const completed = episode.segments.filter(segment => {
        const isQuoteSegment = segment.title.toLowerCase().includes('quote') || segment.id === 'inspirational-quote-outro';
        if (isQuoteSegment) { return !!(segment.host1Quote?.trim()) && !!(segment.host1Author?.trim()); }
        else { return !!(segment.host1Notes?.trim() && segment.host1Notes.trim() !== '{"type":"doc","content":[{"type":"paragraph"}]}' ); }
    }).length;
    return { completed, total };
};


type Tip = {
    id: string;
    text: string;
    category: string;
    link?: string;
    modes?: string[]; // Tip is only relevant for these modes
    dynamicFields?: string[];
    condition?: (episode: Episode, mode: AppMode) => boolean;
    episodeContext?: Episode;
};

const ALL_TIPS: Tip[] = [
    // Existing Tips (Reviewed & Kept)
    { id: 'tip1', text: "Use the 'Edit Structure' page to create reusable layouts for your {episodeLabels}. A real time-saver!", category: "general", link: "/settings/segments" },
    { id: 'tip2', text: "In a hurry? Expand an item card on the dashboard to edit its {segmentLabels} inline. Changes save automatically when you click away.", category: "dashboard" },
    { id: 'tip3', text: "Customize your 'Username' in General Settings. It shows up in exports and when you share content with collaborators.", category: "general", link: "/settings" },
    { id: 'tip5', text: "The Board View isn't just for looks! It automatically moves your {episodeLabels} as you complete them and set dates.", category: "dashboard", link: "/dashboard?view=board" },
    { id: 'tip6', text: "Drag-and-drop {segmentLabels} in the editor or on an expanded dashboard card to instantly reorder your plan.", category: "editing" },
    { id: 'tip7', text: "Use the 'Save Current State' feature in the user menu before making big changes. It's like a manual backup for your entire workspace!", category: "settings", link: "/settings#manage-workspaces" },
    { id: 'tip8_new', text: "Feel like your dashboard is getting cluttered? Use the 'Archive' option on an {episodeLabel}'s card to move it to a separate, collapsed section at the bottom.", category: "dashboard" },
    { id: 'tip13', text: "Stuck on a {segmentLabel}? Use the 'AI Content Polish' feature in the full editor to get help rewriting or expanding your notes.", category: "editing", link: "/tutorial" },
    { id: 'tip14', text: "The AI Plan Generator can understand complex requests like 'a 3-part documentary on bees, with the first part for kids'. Be specific to get better results!", category: "dashboard" },
    { id: 'tip17', text: "Fill in all content for your {segmentLabels} and set a '{scheduledLabel}' date to move an {episodeLabel} to the '{scheduledLabel}' column on the Board View.", category: "dashboard", dynamicFields: ['statusWorkflow.scheduled.label'], link: "/dashboard?view=board" },
    { id: 'tip21', text: "Organize your dashboard by adding a {seasonLabel} number to an {episodeLabel} in the full editor. It will automatically group them together!", category: "dashboard" },
    { id: 'tip22', text: "Use the Calendar page to get a high-level overview of your production schedule. Click a date to see all relevant {episodeLabels}.", category: "general", link: "/calendar" },
    { id: 'tip29', text: "Did you know you can add custom tasks and deadlines directly to the Calendar page? It's a great way to keep track of smaller to-dos alongside your main project schedule.", category: "general", link: "/calendar" },
    { id: 'tip32', text: "The Board View is now organized by {seasonLabel}! Collapse seasons you're not focused on to get a clearer picture of your current workflow.", category: "dashboard", link: "/dashboard?view=board" },
    { id: 'tip34', text: "Have a plan in a text file? Use the 'Structured Plan Importer' in Settings to add new items from simple Markdown or JSON files without overwriting your current work.", category: "settings", link: "/settings#file-importer-card" },

    // New Tips
    { id: 'tip-theme-1', text: "Did we mention we have themes? Go to General Settings to customize your look, or click the ✨ icon in the navbar to try a random one!", category: "general", link: "/settings" },
    { id: 'tip-theme-2', text: "Feeling creative? You can build your own color scheme from scratch in the 'Custom Themes' section of your settings.", category: "settings", link: "/settings#custom-themes-card" },
    { id: 'tip-theme-3', text: "The 'Breeze Candy' theme offers a light and airy feel, perfect for planning on a sunny day. Give it a try in Settings!", category: "themes", link: "/settings" },
    { id: 'tip-theme-4', text: "For a more dramatic and focused workspace, try one of the dark themes like 'Navy Flame' or 'Scarlet Brew'.", category: "themes", link: "/settings" },
    { id: 'tip-fun-1', text: "Is your brain completely empty? Perfect. That's what the AI Plan Generator is for. Feed it a single word and see what happens.", category: "humor" },
    { id: 'tip-fun-2', text: "Remember to stay hydrated. Your brilliant ideas need water. And maybe coffee. Definitely coffee.", category: "humor" },
    { id: 'tip-fun-3', text: "The 'No Season' checkbox is for rebels, one-offs, and brilliant ideas that defy categorization. We see you.", category: "creative" },
    { id: 'tip-prod-1', text: "Use the 'Timeline' view on the dashboard to spot scheduling conflicts before they become a problem.", category: "dashboard", link: "/dashboard?view=timeline" },
    { id: 'tip-prod-2', text: "Link a checklist item to a specific {segmentLabel} in the full editor. It's a great way to tie production tasks directly to your content.", category: "editing" },
    { id: 'tip-prod-3', text: "Export a Season as a Markdown file. It's perfect for a clean, readable backup or for pasting into other apps like Notion or Obsidian.", category: "dashboard" },
    { id: 'tip-creative-1', text: "Stuck writing dialogue? Try writing the opposite of what the character should say. It can unlock some surprising and authentic moments.", category: "creative" },
    { id: 'tip-creative-2', text: "The 'Personal Journal' mode isn't just for diaries. Use it to track your creative progress, log ideas, or document your project's journey.", category: "creative", modes: ["Personal Journal"] },
  
    // Dynamic & Contextual Tips
    { id: 'tip24', text: "'{title}' is ready for the next step. All its {segmentLabels} are filled. Consider setting a {scheduledLabel} date in the card's date pickers.", category: "dynamic_contextual", dynamicFields: ['statusWorkflow.scheduled.label'], condition: (ep, mode) => !ep.isArchived && calculateGenericEpisodeStatus(ep, mode) === 'planning' && areAllHost1SegmentsFilledForCard(ep.segments) },
    { id: 'tip25', text: "Your {episodeLabel} '{title}' is scheduled! Once it's recorded, just set the '{recordedLabel}' date on the card to move it to the next stage.", category: "dynamic_contextual", dynamicFields: ['statusWorkflow.editing.label'], condition: (ep, mode) => !ep.isArchived && calculateGenericEpisodeStatus(ep, mode) === 'scheduled' },
    { id: 'tip26', text: "You're almost there with '{title}'! Just {remaining} more {segmentLabels} to fill out for {yourContentLabel}.", category: "dynamic_contextual", dynamicFields: ['yourContentLabel'], condition: (ep) => { const { completed, total } = getSegmentProgress(ep); return !ep.isArchived && !areAllHost1SegmentsFilledForCard(ep.segments) && total > 0 && total - completed <= 3 && total - completed > 0; } },
    { id: 'tip27', text: "Have a great idea for '{title}' but need help fleshing it out? Use 'AI Content Polish' in the full editor to brainstorm content for all its {segmentLabels}.", category: "dynamic_contextual", condition: (ep) => !ep.isArchived && ep.segments.length > 3 },
    { id: 'tip33', text: "Made a change you regret? No worries! Go to the full editor for '{title}' and use the 'Version History' button to review and revert to previous saves of your plan.", category: "dynamic_contextual", condition: (ep) => !ep.isArchived && ep.segments.length > 0 },
    { id: 'tip-dynamic-new-1', text: "Your project '{title}' has a guest listed but no scheduled date yet. Time to get it on the calendar!", category: "dynamic_contextual", condition: (ep) => !ep.isArchived && !!ep.specialGuest && !ep.dateScheduledForRecording },
    { id: 'tip-dynamic-new-2', text: "Looks like '{title}' is still in planning. Try using the AI Content Polish tool to quickly flesh out its {segmentLabels}.", category: "dynamic_contextual", condition: (ep, mode) => !ep.isArchived && calculateGenericEpisodeStatus(ep, mode) === 'planning' && ep.segments.length > 2 },
    { id: 'tip-new-teams', text: "Collaborating with a group? Create a Team in Settings to get a shared dashboard and manage projects together.", category: "teams", link: "/settings/teams" },
    { id: 'tip-new-community', text: "Connect with a 'Planner Pal' on the Community page to see their public activity feed and stay motivated.", category: "community", link: "/settings/community" },
    { id: 'tip-new-analytics', text: "Curious about your workflow? Check out the new Analytics page in Settings for data-driven insights on your productivity.", category: "analytics", link: "/settings/analytics" },
    { id: 'tip-new-disable', text: "Not a fan of these tips? You can turn them off at any time in General Settings.", category: "general", link: "/settings" },
];

interface ProTipCardProps {
    episodes: Episode[];
    setFocusOnEpisode: (focus: { episodeId: string; seasonKey: string; } | null) => void;
}

export default function ProTipCard({ episodes, setFocusOnEpisode }: ProTipCardProps) {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const { user } = useAuth();
  const { settings, loadingSettings } = useUserSettings();
  const { currentMode, isLoadingMode } = useAppContextMode();
  const [host1Name, setHost1Name] = useState('your content');

  useEffect(() => {
    if (user?.uid) {
      getCustomHost1Name(user.uid).then(name => setHost1Name(name || 'your content'));
    }
  }, [user]);

  const selectTip = useCallback(() => {
    if (!currentMode || !episodes) return;

    const activeEpisodes = episodes.filter(ep => !ep.isArchived);

    // Filter tips that are relevant to the current mode
    const relevantTips = ALL_TIPS.filter(tip => 
      !tip.modes || tip.modes.includes(currentMode.modeName)
    );

    // Give dynamic tips a higher chance of appearing if eligible
    const eligibleDynamicTips = relevantTips.filter(tip =>
      tip.condition && activeEpisodes.some(ep => tip.condition!(ep, currentMode))
    );

    let chosenTip: Tip | null = null;
    let episodeContext: Episode | undefined = undefined;

    if (eligibleDynamicTips.length > 0 && Math.random() > 0.4) {
      const randomDynamicTip = eligibleDynamicTips[Math.floor(Math.random() * eligibleDynamicTips.length)];
      const episodeForTip = activeEpisodes.find(ep => randomDynamicTip.condition!(ep, currentMode));
      chosenTip = randomDynamicTip;
      episodeContext = episodeForTip;

    } else {
      // Fallback to any non-dynamic, relevant tip
      const generalRelevantTips = relevantTips.filter(t => t.category !== 'dynamic_contextual');
      if (generalRelevantTips.length > 0) {
        const randomIndex = Math.floor(Math.random() * generalRelevantTips.length);
        chosenTip = generalRelevantTips[randomIndex];
      } else if (relevantTips.length > 0) { // If no general tips, pick any relevant one
        const randomIndex = Math.floor(Math.random() * relevantTips.length);
        chosenTip = relevantTips[randomIndex];
      }
    }
    
    if (chosenTip) {
        setCurrentTip({ ...chosenTip, episodeContext: episodeContext });
    }

  }, [currentMode, episodes]);

  useEffect(() => {
    if (loadingSettings || isLoadingMode) return;

    const shouldBeVisible = (settings?.showProTips ?? true) && !sessionDismissed;

    if (shouldBeVisible && !currentTip) {
      selectTip();
    }
    
    setIsVisible(shouldBeVisible);

  }, [settings?.showProTips, sessionDismissed, currentTip, loadingSettings, isLoadingMode, selectTip]);


  const handleDismiss = () => {
    setSessionDismissed(true);
  };

  const handleNewTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectTip();
    if (sessionDismissed) setSessionDismissed(false);
  };
  
  const handleEpTitleClick = (e: React.MouseEvent, episode: Episode) => {
    e.preventDefault();
    const getSeasonKey = (ep: Episode): string => {
        if (ep.seasonName && ep.seasonName.trim() !== '') return ep.seasonName;
        return ep.seasonNumber !== null && ep.seasonNumber !== undefined
            ? `season-${ep.seasonNumber}`
            : 'no-season';
    };
    const seasonKey = getSeasonKey(episode);
    setFocusOnEpisode({ episodeId: episode.id, seasonKey });
  };

  const renderFormattedTip = (tip: Tip): React.ReactNode => {
    if (!currentMode) return tip.text;

    const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

    const processLabel = (label: string, isPlural: boolean): string => {
        if (!label) return '';
        const parts = label.split('/').map(part => {
            let processedPart = capitalizeFirstLetter(part.trim().toLowerCase());
            if (isPlural) {
                if (processedPart.endsWith('y') && !['a','e','i','o','u'].includes(processedPart.charAt(processedPart.length - 2).toLowerCase())) {
                    processedPart = processedPart.slice(0, -1) + 'ies';
                } else if (processedPart.endsWith('s')) {
                    processedPart += 'es';
                } else {
                    processedPart += 's';
                }
            }
            return processedPart;
        });
        return parts.join(' / ');
    };

    const replacements: { [key: string]: string } = {
        '{yourContentLabel}': `'${host1Name}'`,
        '{planningLabel}': currentMode.statusWorkflow.planning.label,
        '{scheduledLabel}': currentMode.statusWorkflow.scheduled.label,
        '{recordedLabel}': currentMode.statusWorkflow.editing.label,
        '{uploadedLabel}': currentMode.statusWorkflow.published.label,
    };

    if (tip.episodeContext) {
        replacements['{title}'] = tip.episodeContext.title;
        const { completed, total } = getSegmentProgress(tip.episodeContext);
        replacements['{remaining}'] = (total - completed).toString();
    }
    
    let processedText = tip.text;

    processedText = processedText.replace(/\{(\w+Label)(s?)\}/g, (match, key: keyof AppMode, pluralS) => {
      const rawSingular = currentMode[key as keyof AppMode] as string || key.replace('Label', '');
      return `[[${processLabel(rawSingular, pluralS === 's')}]]`;
    });

    processedText = processedText.replace(/\{(\w+)\}/g, (match, key) => {
      return replacements[match] || match;
    });

    const pageLinks = {
      "'Edit Structure' page": "/settings/segments",
      "General Settings": "/settings",
      "Calendar page": "/calendar",
      "Calendar": "/calendar",
      "Settings": "/settings",
      "Board View": "/dashboard?view=board",
      "'Save Current State'": "/settings#manage-workspaces",
      "'Structured Plan Importer'": "/settings#file-importer-card",
      "'Custom Themes' section": "/settings#custom-themes-card",
    };

    let nodes: (React.ReactNode | string)[] = [processedText];
    
    if (tip.episodeContext && processedText.includes(tip.episodeContext.title)) {
        const titleRegex = new RegExp(`('${tip.episodeContext.title}')`, 'g');
        const newNodes: (React.ReactNode | string)[] = [];
        nodes.forEach((node, nodeIndex) => {
            if (typeof node === 'string') {
                const parts = node.split(titleRegex);
                parts.forEach((part, index) => {
                    if (part === `'${tip.episodeContext!.title}'`) {
                        newNodes.push(
                            <button key={`ep-link-${nodeIndex}-${index}`} onClick={(e) => handleEpTitleClick(e, tip.episodeContext!)} className="font-semibold text-accent hover:underline focus:outline-none p-0 m-0 bg-transparent border-none cursor-pointer">
                                {part}
                            </button>
                        );
                    } else {
                        newNodes.push(part);
                    }
                });
            } else {
                newNodes.push(node);
            }
        });
        nodes = newNodes;
    }

    Object.entries(pageLinks).forEach(([pageName, path]) => {
      if (!path) return;
      const newNodes: (React.ReactNode | string)[] = [];
      const regex = new RegExp(`(${pageName.replace(/'/g, "'")})`, 'gi');

      nodes.forEach((node, nodeIndex) => {
        if (typeof node === 'string') {
          const parts = node.split(regex);
          parts.forEach((part, index) => {
            if (part.toLowerCase() === pageName.toLowerCase()) {
              newNodes.push(
                <Link key={`${pageName}-${nodeIndex}-${index}`} href={path} className="font-semibold text-accent hover:underline">
                  {part}
                </Link>
              );
            } else {
              newNodes.push(part);
            }
          });
        } else {
          newNodes.push(node);
        }
      });
      nodes = newNodes;
    });

    const finalNodes: (React.ReactNode | string)[] = [];
    nodes.forEach((node, nodeIndex) => {
        if (typeof node === 'string') {
            const parts = node.split(/(\[\[.*?\]\])/g);
            parts.forEach((part, index) => {
                if (part.startsWith('[[') && part.endsWith(']]')) {
                    finalNodes.push(<span key={`label-${nodeIndex}-${index}`} className="font-semibold text-primary">{part.slice(2, -2)}</span>);
                } else {
                    finalNodes.push(part);
                }
            });
        } else {
            finalNodes.push(node);
        }
    });

    return <p className="text-sm text-foreground/80 mb-3">{finalNodes.map((n, i) => <React.Fragment key={i}>{n}</React.Fragment>)}</p>;
  };
  
  if (!isVisible || !currentTip) {
    return null;
  }

  return (
    <Card className="mb-6 bg-primary/10 border-primary/30 shadow-md animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-md font-semibold text-primary flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
          Pro Tip!
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-7 w-7 text-primary/70 hover:text-primary">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {renderFormattedTip(currentTip)}
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewTip} className="text-xs h-7 bg-background/70 hover:bg-background">
              <RefreshCw className="h-3 w-3 mr-1.5" />
              New Tip
            </Button>
            {currentTip.link && (
                <Button asChild variant="default" size="sm" className="text-xs h-7">
                    <Link href={currentTip.link}>
                        Learn More <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Link>
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
