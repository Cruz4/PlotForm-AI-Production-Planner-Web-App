
// src/lib/markdownUtils.ts
import type { Episode, Segment } from '@/types';
import { format, isPast } from 'date-fns';

const escapeMarkdown = (text: string | undefined | null): string => {
  if (text === null || text === undefined) return '';
  return text
    .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

const formatDateForMarkdown = (timestamp: number | null | undefined): string => {
  if (!timestamp) return 'N/A';
  return format(new Date(timestamp), 'PPP'); 
};

const getEpisodeStatusForMarkdown = (episode: Episode): string => {
  if (episode.isArchived) return "🗄️ Archived";
  if (episode.dateUploaded && isPast(new Date(episode.dateUploaded))) return "✅ Uploaded";
  if (episode.dateRecorded && isPast(new Date(episode.dateRecorded))) return "🎤 Recorded";
  if (episode.dateScheduledForRecording && !isPast(new Date(episode.dateScheduledForRecording))) return `🗓️ Scheduled for Recording (${formatDateForMarkdown(episode.dateScheduledForRecording)})`;
  if (episode.dateScheduledForRecording && isPast(new Date(episode.dateScheduledForRecording)) && !episode.dateRecorded) return `🕒 Overdue for Recording (Scheduled: ${formatDateForMarkdown(episode.dateScheduledForRecording)})`;
  return "📝 Planning";
};

export const generateEpisodeMarkdown = (episode: Episode, primaryUserName: string, importedUserName?: string | null, contentLabel: string = "Content"): string => {
  let md = `# ${escapeMarkdown(episode.title) || 'Untitled Episode'} (#${escapeMarkdown(episode.episodeNumber?.toString()) || 'N/A'})\n\n`;

  md += `## 📋 Overview\n`; 
  md += `- **Status:** ${getEpisodeStatusForMarkdown(episode)}\n`;
  if (episode.seasonNumber) {
    md += `- **Season:** ${episode.seasonNumber}\n`;
  }
  md += `- **Scheduled Recording:** ${formatDateForMarkdown(episode.dateScheduledForRecording)}\n`;
  md += `- **Date Recorded:** ${formatDateForMarkdown(episode.dateRecorded)}\n`;
  md += `- **Date Uploaded:** ${formatDateForMarkdown(episode.dateUploaded)}\n`;
  if (episode.specialGuest) {
    md += `- **Special Guest:** ${escapeMarkdown(episode.specialGuest)}\n`;
  }
  if (episode.lunchProvidedBy) { // This is now generic "Detail"
    md += `- **Detail Field:** ${escapeMarkdown(episode.lunchProvidedBy)}\n`;
  }
  if (episode.episodeNotes && episode.episodeNotes.trim()) {
    md += `\n**📝 General Episode Notes:**\n`; 
    md += `> ${episode.episodeNotes.split('\n').map(line => escapeMarkdown(line)).join('\n> ')}\n`;
  }
  md += `\n---\n\n`;

  md += `## 🎙️ Segments Plan\n\n`; 

  episode.segments.forEach(segment => {
    md += `### ${escapeMarkdown(segment.title) || 'Untitled Segment'}\n`;
    if (segment.subtitle) {
      md += `_${escapeMarkdown(segment.subtitle)}_\n\n`;
    }

    // --- Primary User's Content ---
    md += `#### 👤 ${escapeMarkdown(primaryUserName)}'s Content\n`;
    const hasPrimaryScript = segment.host1Notes && segment.host1Notes.trim() !== '';
    const hasPrimaryLinks = segment.host1Links && segment.host1Links.filter(link => link && link.trim()).length > 0;
    const hasPrimarySegNotes = segment.host1AudienceSuggestions && segment.host1AudienceSuggestions.trim() !== '';
    const isPrimaryQuoteSegment = (segment.title.toLowerCase().includes('quote') || segment.id === 'inspirational-quote-outro');

    if (isPrimaryQuoteSegment) {
      md += `- [ ] **✍️ Quote (${escapeMarkdown(primaryUserName)}):**\n`;
      if (segment.host1Quote && segment.host1Quote.trim()) {
        md += `  > ${segment.host1Quote.split('\n').map(line => escapeMarkdown(line)).join('\n  > ')}\n`;
        if (segment.host1Author && segment.host1Author.trim()) {
          md += `  > \n  > — ${escapeMarkdown(segment.host1Author)}\n`;
        }
      } else {
        md += `  > (No quote provided for ${escapeMarkdown(primaryUserName)})\n`;
      }
      md += `\n`;
    } else {
      md += `- [ ] **📝 ${escapeMarkdown(contentLabel)} (${escapeMarkdown(primaryUserName)}):**\n`;
      if (hasPrimaryScript) {
        md += `  > ${segment.host1Notes.split('\n').map(line => escapeMarkdown(line)).join('\n  > ')}\n`;
      } else {
        md += `  > (No ${contentLabel.toLowerCase()} provided for ${escapeMarkdown(primaryUserName)})\n`;
      }
      md += `\n`;

      md += `- [ ] **🔗 Links/Media (${escapeMarkdown(primaryUserName)}):**\n`;
      if (hasPrimaryLinks) {
        segment.host1Links.filter(link => link && link.trim()).forEach(link => {
          md += `  - [${escapeMarkdown(link)}](${link})\n`;
        });
      } else {
        md += `  > (No links for ${escapeMarkdown(primaryUserName)})\n`;
      }
      md += `\n`;

      md += `- [ ] **🗒️ Segment Notes (${escapeMarkdown(primaryUserName)}):**\n`;
      if (hasPrimarySegNotes) {
        md += `  > ${segment.host1AudienceSuggestions.split('\n').map(line => escapeMarkdown(line)).join('\n  > ')}\n`;
      } else {
        md += `  > (No segment notes for ${escapeMarkdown(primaryUserName)})\n`;
      }
      md += `\n`;
    }

    // --- Imported User's Content (if exists and relevant) ---
    const importedUserDisplayName = importedUserName || "Collaborator"; // Use passed name or default
    const hasImportedData = (
        (segment.host2Notes && segment.host2Notes.trim() !== '') ||
        (Array.isArray(segment.host2Links) && segment.host2Links.filter(l => l && l.trim()).length > 0) ||
        (segment.host2AudienceSuggestions && segment.host2AudienceSuggestions.trim() !== '') ||
        (segment.host2Quote && segment.host2Quote.trim() !== '') ||
        (segment.host2Author && segment.host2Author.trim() !== '')
    );

    if(hasImportedData && importedUserName){ // Only show if importedUserName is provided
      md += `#### 👥 ${escapeMarkdown(importedUserDisplayName)}'s Content\n`;
      const hasImportedScript = segment.host2Notes && segment.host2Notes.trim() !== '';
      const hasImportedLinks = segment.host2Links && segment.host2Links.filter(link => link && link.trim()).length > 0;
      const hasImportedSegNotes = segment.host2AudienceSuggestions && segment.host2AudienceSuggestions.trim() !== '';
      const isImportedQuoteSegment = (segment.title.toLowerCase().includes('quote') || segment.id === 'inspirational-quote-outro');

      if (isImportedQuoteSegment) {
        md += `- [ ] **✍️ Quote (${escapeMarkdown(importedUserDisplayName)}):**\n`;
        if (segment.host2Quote && segment.host2Quote.trim()) {
          md += `  > ${segment.host2Quote.split('\n').map(line => escapeMarkdown(line)).join('\n  > ')}\n`;
          if (segment.host2Author && segment.host2Author.trim()) {
            md += `  > \n  > — ${escapeMarkdown(segment.host2Author)}\n`;
          }
        } else {
          md += `  > (No quote provided for ${escapeMarkdown(importedUserDisplayName)})\n`;
        }
        md += `\n`;
      } else {
        md += `- [ ] **📝 ${escapeMarkdown(contentLabel)} (${escapeMarkdown(importedUserDisplayName)}):**\n`;
        if (hasImportedScript) {
          md += `  > ${segment.host2Notes.split('\n').map(line => escapeMarkdown(line)).join('\n  > ')}\n`;
        } else {
          md += `  > (No ${contentLabel.toLowerCase()} provided for ${escapeMarkdown(importedUserDisplayName)})\n`;
        }
        md += `\n`;

        md += `- [ ] **🔗 Links/Media (${escapeMarkdown(importedUserDisplayName)}):**\n`;
        if (hasImportedLinks) {
          segment.host2Links.filter(link => link && link.trim()).forEach(link => {
            md += `  - [${escapeMarkdown(link)}](${link})\n`;
          });
        } else {
          md += `  > (No links for ${escapeMarkdown(importedUserDisplayName)})\n`;
        }
        md += `\n`;

        md += `- [ ] **🗒️ Segment Notes (${escapeMarkdown(importedUserDisplayName)}):**\n`;
        if (hasImportedSegNotes) {
          md += `  > ${segment.host2AudienceSuggestions.split('\n').map(line => escapeMarkdown(line)).join('\n  > ')}\n`;
        } else {
          md += `  > (No segment notes for ${escapeMarkdown(importedUserDisplayName)})\n`;
        }
        md += `\n`;
      }
    }
    md += `---\n\n`; 
  });

  return md;
};
