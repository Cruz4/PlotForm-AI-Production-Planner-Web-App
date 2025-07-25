
// src/lib/modeIcons.tsx
import {
  Mic, Film, BookOpen, Drama, Gamepad2, GraduationCap, Youtube, Newspaper, DiscAlbum,
  Briefcase, Code, Binary, HeartPulse, NotebookText, Megaphone, Dices, ChefHat,
  FileText, Presentation, Palette, ClipboardCheck, HelpCircle
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type React from 'react';

// Define a more specific type for Lucide icon components
export type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

export const getModeIcon = (modeName: string): IconComponent => {
  switch (modeName) {
    case "Podcast": return Mic;
    case "Movie / Film Project": return Film;
    case "Book / Novel": return BookOpen;
    case "Stage Play": return Drama;
    case "Game Narrative": return Gamepad2;
    case "Course / Curriculum": return GraduationCap;
    case "YouTube Series": return Youtube;
    case "Magazine / Newsletter": return Newspaper;
    case "Music Album": return DiscAlbum;
    case "Client Project": return Briefcase;
    case "App Development": return Code;
    case "Interactive Fiction": return Binary;
    case "Wellness Program": return HeartPulse;
    case "Personal Journal": return NotebookText;
    case "Marketing Campaign": return Megaphone;
    case "D&D / RPG Planner": return Dices;
    case "Recipe Builder": return ChefHat;
    case "Academic Paper": return FileText;
    case "Pitch Deck": return Presentation;
    case "Art Portfolio": return Palette;
    case "Challenge Tracker": return ClipboardCheck;
    default: return HelpCircle; // Fallback icon
  }
};
