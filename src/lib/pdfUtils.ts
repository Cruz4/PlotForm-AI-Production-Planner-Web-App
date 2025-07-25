
'use client';

import type { Episode, Segment } from '@/types';
import { format } from 'date-fns';

// Function to safely get segment property, now more direct based on host
const getHostSpecificContent = (segment: Segment, host: 'host1' | 'host2'): { script: string, links: string[], segmentNotes: string, quote?: string, author?: string } => {
  return {
    script: segment[`${host}Notes`] || '',
    links: Array.isArray(segment[`${host}Links`]) ? segment[`${host}Links`] : [],
    segmentNotes: segment[`${host}AudienceSuggestions`] || '',
    quote: segment[`${host}Quote`] || '',
    author: segment[`${host}Author`] || '',
  };
};

const escapeHtml = (unsafe: string | undefined | null): string => {
  if (unsafe === null || unsafe === undefined) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const generateEpisodePdf = async (
  episode: Episode,
  hostChoice: 'host1' | 'host2' | 'both',
  primaryUserName: string,
  importedUserName?: string | null
): Promise<void> => {
  if (typeof window === 'undefined') {
    console.warn('PDF generation called on server, aborting.');
    return;
  }

  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = html2pdfModule.default || html2pdfModule;


  if (typeof html2pdf !== 'function') {
    console.error("html2pdf.js did not load correctly or is not a function.", html2pdf);
    alert("PDF generation library failed to load. Please try again or contact support if the issue persists.");
    return;
  }

  let contentHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Episode Plan: ${escapeHtml(episode.title)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        body { 
          font-family: 'Roboto', Arial, sans-serif; 
          margin: 25px; 
          color: #333333; 
          line-height: 1.6;
          font-size: 10pt;
        }
        .container { width: 100%; max-width: 780px; margin: 0 auto; }
        
        .header-main-title { 
          color: #1A202C; 
          border-bottom: 3px solid #7DD3FC; 
          padding-bottom: 10px; 
          margin-bottom: 20px; 
          font-size: 26px; 
          font-weight: 700;
          text-align: center;
        }

        .cover-image-container {
          text-align: center;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .cover-image {
          max-width: 100%;
          max-height: 400px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .section-title { 
          color: #1A202C; 
          margin-top: 20px; 
          margin-bottom: 10px; 
          font-size: 20px; 
          font-weight: 700;
          border-bottom: 1px solid #E2E8F0; 
          padding-bottom: 6px; 
        }
        
        .segment-title-main { 
          font-size: 18px; 
          font-weight: 700; 
          color: #2D3748; 
          margin-bottom: 5px; 
        }
        .segment-subtitle { 
          font-size: 13px; 
          color: #555555; 
          margin-bottom: 12px; 
          font-style: italic; 
        }

        .meta-info { 
          margin-bottom: 20px; 
          padding: 15px; 
          background-color: #F5F3FF; 
          border-radius: 8px;
          border: 1px solid #D6BCFA; 
        }
        .meta-info p { margin: 5px 0; font-size: 11pt; }
        .meta-info strong { color: #2D3748; font-weight: 500; }
        .meta-notes {
          margin-top: 8px;
          padding: 10px;
          background-color: #FFFFFF;
          border-radius: 4px;
          border: 1px solid #E5E7EB;
          font-size: 10pt;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .segment { 
          margin-bottom: 20px; 
          padding: 15px; 
          border: 1px solid #D1D5DB; 
          border-radius: 10px; 
          background-color: #F9FAFB; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          page-break-inside: avoid;
        }
        
        .host-section { 
          margin-top: 15px; 
          padding: 12px; 
          border-radius: 6px;
        }
        .host-section.host1 {
          background-color: #F0EFFF; 
          border-left: 5px solid #A78BFA; 
        }
        .host-section.host2 {
          background-color: #E0F5FF; 
          border-left: 5px solid #7DD3FC; 
        }
        .host-label { 
          font-size: 13px; 
          font-weight: 700; 
          color: #4B5563; 
          margin-bottom: 8px; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .content-label {
          font-size: 10pt; 
          font-weight: 500;
          color: #555555; 
          margin-top: 8px; 
          margin-bottom: 4px;
        }
        .notes-script-content, .segment-notes-content-block, .links-list-empty-placeholder { 
          white-space: pre-wrap; 
          background-color: #FFFFFF; 
          padding: 10px; 
          border-radius: 4px; 
          border: 1px solid #E5E7EB; 
          font-size: 10pt;
          word-wrap: break-word;
        }
        .links-list { list-style-type: disc; padding-left: 25px; margin-top: 5px; margin-bottom: 10px; }
        .links-list li { margin-bottom: 4px; font-size: 10pt; word-wrap: break-word; }
        .links-list a { color: #2563EB; text-decoration: none; }
        .links-list a:hover { text-decoration: underline; }

        .quote-section { margin-top: 8px; }
        .quote-text { 
          font-style: italic; 
          padding: 10px 12px; 
          background-color: #FFFFFF; 
          border-left: 4px solid #7DD3FC; 
          margin-bottom: 6px; 
          border-radius: 4px; 
          font-size: 11pt;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .author-text { 
          text-align: right; 
          font-size: 10pt; 
          color: #555555; 
          background-color: #FFFFFF;
          padding: 8px 12px; 
          border-radius: 4px;
          border: 1px solid #E5E7EB;
        }
        
        .no-content { color: #777777; font-style: italic; font-size: 10pt; }
        
        .separator { border-top: 1px dashed #CBD5E1; margin: 20px 0; } 
        
        footer { 
          width: 100%;
          text-align: center; 
          font-size: 9pt; 
          color: #999999; 
          border-top: 1px solid #EEE; 
          padding-top: 10px; 
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header-main-title">Episode Plan: ${escapeHtml(episode.title)} (#${escapeHtml(episode.episodeNumber?.toString()) || 'N/A'})</div>
    `;

  if (episode.coverImageUrl) {
    contentHtml += `<div class="cover-image-container"><img src="${escapeHtml(episode.coverImageUrl)}" class="cover-image" alt="Cover Image"></div>`;
  }

  contentHtml += `
    <div class="meta-info">
      <div class="section-title">Episode Details</div>
      <p><strong>Date Recorded:</strong> ${episode.dateRecorded ? format(new Date(episode.dateRecorded), 'PPP') : 'Not Recorded Yet'}</p>
      <p><strong>Date Uploaded:</strong> ${episode.dateUploaded ? format(new Date(episode.dateUploaded), 'PPP') : 'Not Uploaded Yet'}</p>
      ${episode.specialGuest ? `<p><strong>Special Guest:</strong> ${escapeHtml(episode.specialGuest)}</p>` : ''}
      ${episode.lunchProvidedBy ? `<p><strong>Detail Field:</strong> ${escapeHtml(episode.lunchProvidedBy)}</p>` : ''}
      ${episode.episodeNotes || (hostChoice !== 'both' && !episode.specialGuest && !episode.lunchProvidedBy) ? 
        `<p><strong>General Episode Notes:</strong></p><div class="meta-notes">${episode.episodeNotes ? escapeHtml(episode.episodeNotes) : '<span class="no-content">N/A</span>'}</div>` 
        : ''
      }
    </div>
  `;

  contentHtml += `<div class="section-title">Episode Segments</div>`;

  const renderUserData = (segment: Segment, userType: 'primary' | 'imported') => {
    const content = userType === 'primary' ? getHostSpecificContent(segment, 'host1') : getHostSpecificContent(segment, 'host2');
    const userName = userType === 'primary' ? primaryUserName : (importedUserName || 'Collaborator'); 
    
    let userHtml = `<div class="host-section ${userType === 'primary' ? 'host1' : 'host2'}">
                      <div class="host-label">${escapeHtml(userName)}'s Content:</div>`;

    const isQuoteSegment = segment.title.toLowerCase().includes('quote') || segment.id === 'inspirational-quote-outro';

    if (isQuoteSegment) {
      userHtml += `<div class="quote-section">
                     <div class="content-label">Quote:</div>
                     <div class="quote-text">${content.quote ? escapeHtml(content.quote) : '<span class="no-content">N/A</span>'}</div>
                     <div class="content-label">Author:</div>
                     <div class="author-text">${content.author ? escapeHtml(content.author) : '<span class="no-content">N/A</span>'}</div>
                   </div>`;
    } else {
      userHtml += `<div class="notes-script-content">${content.script ? escapeHtml(content.script) : '<span class="no-content">N/A</span>'}</div>`;
      
      userHtml += `<div class="content-label">Links/Media:</div>`;
      const actualLinks = content.links.filter(link => link && link.trim());
      if (actualLinks.length > 0) {
        userHtml += `<ul class="links-list">`;
        actualLinks.forEach(link => { userHtml += `<li><a href="${escapeHtml(link)}" target="_blank">${escapeHtml(link)}</a></li>`; });
        userHtml += `</ul>`;
      } else {
         userHtml += `<div class="links-list-empty-placeholder"><span class="no-content">N/A</span></div>`;
      }
      userHtml += `<div class="content-label">Segment Notes:</div><div class="segment-notes-content-block">${content.segmentNotes ? escapeHtml(content.segmentNotes) : '<span class="no-content">N/A</span>'}</div>`;
    }
    userHtml += `</div>`;
    return userHtml;
  };

  episode.segments.forEach(segment => {
    contentHtml += `
      <div class="segment">
        <div class="segment-title-main">${escapeHtml(segment.title)}</div>
        ${segment.subtitle ? `<div class="segment-subtitle">${escapeHtml(segment.subtitle)}</div>` : ''}
    `;
    if (hostChoice === 'host1' || hostChoice === 'both') {
      contentHtml += renderUserData(segment, 'primary');
    }
    
    const primaryUserHasContent = getHostSpecificContent(segment, 'host1').script || getHostSpecificContent(segment, 'host1').quote;
    const importedUserHasContent = getHostSpecificContent(segment, 'host2').script || getHostSpecificContent(segment, 'host2').quote || (getHostSpecificContent(segment, 'host2').links && getHostSpecificContent(segment, 'host2').links.length > 0) || getHostSpecificContent(segment, 'host2').segmentNotes;

    if (hostChoice === 'both' && primaryUserHasContent && importedUserHasContent) {
      contentHtml += '<div class="separator"></div>';
    }

    if ((hostChoice === 'host2' || hostChoice === 'both') && importedUserHasContent) {
      contentHtml += renderUserData(segment, 'imported');
    }
    contentHtml += `</div>`;
  });

  contentHtml += `
      </div>
    </body>
    </html>
  `;
  
  const footerHtml = `
    <footer>
      Planned with PlotForm Planner - Generated on ${format(new Date(), 'PPP p')}
    </footer>
  `;
  
  // Create a container for the main content and the footer
  const finalHtmlContainer = document.createElement('div');
  finalHtmlContainer.innerHTML = contentHtml;
  
  // Create the footer element and append it
  const footerElement = document.createElement('div');
  footerElement.innerHTML = footerHtml;
  finalHtmlContainer.querySelector('.container')?.appendChild(footerElement.firstChild!);


  const sanitizedTitle = (episode.title || 'untitled_episode').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  let exportVersionName = '';
  if (hostChoice === 'host1') exportVersionName = (primaryUserName || 'User').replace(/[^a-z0-9]/gi, '_');
  else if (hostChoice === 'host2') exportVersionName = (importedUserName || 'Collaborator').replace(/[^a-z0-9]/gi, '_');
  else exportVersionName = 'BothUsers';
  
  const filename = `PlotForm_Planner_${sanitizedTitle}_${exportVersionName}.pdf`;

  const opt = {
    margin:       [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };

  return html2pdf().from(finalHtmlContainer).set(opt).save();
};
