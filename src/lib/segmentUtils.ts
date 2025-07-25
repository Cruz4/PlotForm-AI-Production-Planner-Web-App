
'use client';

// src/lib/segmentUtils.ts
import type { Segment, EpisodeLayout, SegmentTemplate, AppMode } from '@/types';
import { getActiveDefaultLayoutId, getLayoutById } from '@/lib/episodeLayoutsStore';
import { MODE_SPECIFIC_DEFAULT_SEGMENTS, SYSTEM_DEFAULT_LAYOUT_NAME_BASE } from '@/lib/constants';
import { getDefaultAppMode } from '@/lib/modes'; // For fallback

const mapTemplateToSegment = (template: { id: string; title: string; subtitle?: string; }): Segment => ({
  id: template.id,
  title: template.title,
  subtitle: template.subtitle || '',
  host1Notes: '',
  host1Links: [],
  host1AudienceSuggestions: '',
  host1Quote: '',
  host1Author: '',
  host2Notes: '',
  host2Links: [],
  host2AudienceSuggestions: '',
  host2Quote: '',
  host2Author: '',
});

export const getDefaultSegments = async (userId: string, currentSelectedMode?: AppMode): Promise<Segment[]> => {
  console.log('[segmentUtils] getDefaultSegments called for user:', userId);
  const modeToUse = currentSelectedMode || getDefaultAppMode(); // Use passed mode or fallback
  const modeName = modeToUse.modeName;

  if (!userId) {
    console.warn('[segmentUtils] getDefaultSegments called without a userId. Falling back to mode-specific master templates.');
    const defaultTemplatesForMode = MODE_SPECIFIC_DEFAULT_SEGMENTS[modeName] || MODE_SPECIFIC_DEFAULT_SEGMENTS["Podcast"];
    return defaultTemplatesForMode.map(mapTemplateToSegment);
  }

  const activeLayoutId = await getActiveDefaultLayoutId(userId);
  let layoutToUse: EpisodeLayout | null = null;

  // Construct the mode-specific system default ID for comparison
  const systemDefaultIdForCurrentMode = `SYSTEM_DEFAULT_FOR_${modeName.replace(/\s+/g, '_').toUpperCase()}`;

  if (activeLayoutId && activeLayoutId !== systemDefaultIdForCurrentMode) {
    layoutToUse = await getLayoutById(activeLayoutId);
  }

  const mapLayoutSegmentToSegment = (segData: Segment): Segment => ({
    id: segData.id,
    title: segData.title,
    subtitle: segData.subtitle || '',
    host1Notes: segData.host1Notes || '',
    host1Links: Array.isArray(segData.host1Links) ? segData.host1Links : [],
    host1AudienceSuggestions: segData.host1AudienceSuggestions || '',
    host1Quote: segData.host1Quote || '',
    host1Author: segData.host1Author || '',
    host2Notes: segData.host2Notes || '',
    host2Links: Array.isArray(segData.host2Links) ? segData.host2Links : [],
    host2AudienceSuggestions: segData.host2AudienceSuggestions || '',
    host2Quote: segData.host2Quote || '',
    host2Author: segData.host2Author || '',
  });


  if (layoutToUse && Array.isArray(layoutToUse.segments) && layoutToUse.segments.length > 0) {
    console.log(`[segmentUtils] Using active layout for default segments: ${layoutToUse.name}`);
    return layoutToUse.segments.map(mapLayoutSegmentToSegment);
  } else {
    console.log(`[segmentUtils] No active custom layout found or layout has no segments for mode "${modeName}". Using mode-specific default templates.`);
    const defaultTemplatesForMode = MODE_SPECIFIC_DEFAULT_SEGMENTS[modeName] || MODE_SPECIFIC_DEFAULT_SEGMENTS["Podcast"];
    if (!MODE_SPECIFIC_DEFAULT_SEGMENTS[modeName]) {
        console.warn(`[segmentUtils] No specific default segments found for mode "${modeName}". Falling back to "Podcast" defaults.`);
    }
    return defaultTemplatesForMode.map(mapTemplateToSegment);
  }
};
