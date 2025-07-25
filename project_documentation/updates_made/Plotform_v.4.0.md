# Plotform v.4.0 - Change Log

This document summarizes key updates and enhancements included in what corresponds to your "Plotform v.4.0" deployment, based on recent development changes.

## I. Branding & Naming Convention

*   **Universal Rename:** The application has been universally renamed from "PlotformFlow" to "**Plotform**". This change is reflected in the application name constant, UI text, documentation (`README.md`, `BLUEPRINT.md`, `PLOTFORM_EVALUATION.MD`, `PLOTFORM_STRATEGY_AND_MONETIZATION.MD`, `Monetization_Strategy_7DayTrial_OneTimeFee.md`), `package.json`, and `public/manifest.webmanifest`.

## II. Feature Enhancements & User Experience

### 1. Pro Tip Feature (Dashboard)
The "Pro Tip" card on the dashboard (`src/app/dashboard/page.tsx`) has been significantly overhauled:
    *   **Randomized Tips:** Displays a different, random tip from an expanded list each time it's shown.
    *   **Display Frequency:** Configured to appear every other time the dashboard loads (if enabled via settings).
    *   **Dismiss Button (X):** Allows users to hide the tip card for their current session.
    *   **"New Tip" Button (Shuffle Icon):** Users can click to cycle through tips on demand.
    *   **Settings Toggle:** A new switch in "General Settings" (`src/app/settings/page.tsx`) allows users to enable or disable the Pro Tip feature. This setting is stored and managed via `src/contexts/UserSettingsContext.tsx` and `src/types/index.ts`.

### 2. "Reset Application Data" Functionality (General Settings)
    *   **Mock Episode Re-provisioning:** When a user resets their application data via `src/app/settings/page.tsx`, all existing episodes and layouts are cleared, and the standard set of sample/mock episodes (defined in `src/lib/mockData.ts`) are now automatically re-added using logic in `src/lib/dataUtils.ts`.
    *   **Dashboard Redirect:** After a successful data reset, the user is now automatically redirected to the dashboard page.

### 3. UI & UX Polish
    *   **Calendar Page Empty State:** The calendar page (`src/app/calendar/page.tsx`) now displays a helpful message if no episodes with scheduled, recorded, or uploaded dates are found, guiding the user to add dates.
    *   **"Active Default Layout" Prominence:** In "Edit Structure" (`src/app/settings/segments/page.tsx`), the currently active default layout for new episodes is now more clearly highlighted with a badge.
    *   **Published Episode Modal (Board View):** An "Edit Full Plan" button has been added to the modal in `src/components/episodes/PublishedEpisodeModal.tsx`, providing a direct link to the full editor view for published episodes.
    *   **Visual Distinction for Host 2 Content:**
        *   In the full `SegmentEditor` (`src/components/episodes/SegmentEditor.tsx`), Host 2 content sections are now visually differentiated with a subtle background and border.
        *   In the `DashboardListView` (`src/components/dashboard/DashboardListView.tsx`), inline segment editing on cards now also applies similar distinct styling to Host 2 content for better clarity.
    *   **Planner Name Placeholder:** The placeholder text for the "Planner/Show Name" input field (in `src/app/tutorial/page.tsx` and `src/app/settings/page.tsx`) now defaults to "My Plotform".

## III. Build & Configuration
    *   **`next.config.mjs`:** A basic `next.config.mjs` file was added to ensure Next.js has a modern configuration entry point, potentially addressing build issues.

## IV. Documentation & File Structure
    *   **Changelog System:** This file marks the beginning of a versioned changelog system within the `project_documentation/updates_made/` folder.
    *   **File Reorganization:** `BLUEPRINT.md`, `PLOTFORM_EVALUATION.md` (renamed from `PLOTFORMFLOW_EVALUATION.md`), and `PLOTFORM_STRATEGY_AND_MONETIZATION.md` (renamed from `PlotformFlow_Strategy_And_Monetization.md`) were moved into the `project_documentation` folder. The original root files were emptied.

---

*This changelog reflects updates based on the development session leading up to this version. For future updates, a new file (e.g., `Plotform_v.5.0.md`) will be created in the same folder.*
