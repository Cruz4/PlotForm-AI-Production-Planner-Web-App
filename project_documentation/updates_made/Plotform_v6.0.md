
# Plotform v.6.0 - Change Log

**Date:** ${new Date().toUTCString()}

## I. Overall Summary

This version represents a major evolution of Plotform, focusing on dramatically increasing its adaptability and user customization through the introduction of the "Application Modes" system. This system allows users to tailor the application's terminology, default content structures, and workflow labels to suit 21 different types_of creative projects. Alongside this core change, significant enhancements have been made to segment management, the onboarding process, and overall UI dynamicity.

## II. Key Changes & Enhancements

### 1. Application Modes System (Major Feature)

*   **21 Creative Modes Implemented**:
    *   Defined in `src/lib/modes.ts`, supporting diverse project types from "Podcast" and "Book / Novel" to "App Development" and "Recipe Builder".
    *   Each `AppMode` includes specific labels for:
        *   `seasonLabel` (e.g., "Season", "Film Project", "Volume")
        *   `episodeLabel` (e.g., "Episode", "Scene", "Chapter")
        *   `segmentLabel` (e.g., "Segment", "Shot", "Objective")
        *   `guestLabel` (e.g., "Special Guest", "Featured Artist", "Key Cast/Crew")
        *   `detailLabel` (e.g., "Sponsor", "Studio/Producer", "Location/Set")
        *   And others like `newEpisodeButtonLabel`, `noSeasonCheckboxLabel`, etc.
    *   Includes a `statusWorkflow` object for each mode, defining custom labels for the four main progress stages (e.g., "Planning" can become "Scripting", "Outlining", "Ideation", etc.) and specifying which date fields trigger these status changes.
*   **Mode Selection**:
    *   A mode selector has been integrated into the initial tutorial flow for new users (`src/app/tutorial/page.tsx`).
    *   Users can change their active mode at any time via "General Settings" (`src/app/settings/page.tsx`). This now includes a confirmation dialog and will clear existing data to re-provision new mode-specific sample data.
    *   The selected mode is saved in `usersettings.selectedAppModeName`.
*   **Global Mode Context**:
    *   A new `ModeContext` (`src/contexts/ModeContext.tsx`) provides the `currentMode` object globally, allowing components to adapt dynamically.

### 2. Dynamic UI Labeling & Content

*   **App-Wide Label Adaptation**: UI labels for seasons, episodes, segments, guest/detail fields, status names, button texts, and placeholders are now dynamically updated across the application based on the `currentMode`. This includes:
    *   Dashboard views (List & Board)
    *   Full Episode/Item Editor (`EpisodeForm.tsx`)
    *   Calendar Page
    *   Settings Pages (General, Edit Structure)
    *   Tutorial Page
    *   Toast notifications and dialogs.
*   **Mode-Specific Default Segments**:
    *   `MODE_SPECIFIC_DEFAULT_SEGMENTS` defined in `src/lib/constants.ts`, providing unique default segment structures for each of the 21 modes.
    *   The `getDefaultSegments` function (now in `src/lib/segmentUtils.ts`) now uses these mode-specific defaults when a new "episode" (or its mode-equivalent) is created, if no custom user layout is set as default for that mode.
    *   The "Load Default Structure" button on the "Edit Structure" page now loads defaults relevant to the `currentMode`.

### 3. Enhanced Segment Management

*   **Full Editor (`EpisodeForm.tsx`)**:
    *   Users can now add custom-named segments (with optional subtitles) directly, in addition to adding from mode-specific templates. The custom add form is now hidden by default and shown on button click.
*   **Expanded Dashboard Card View (`DashboardListView.tsx`)**:
    *   Users can add new custom-named segments (with optional subtitles) directly within an expanded item card. This form is also now hidden by default.
    *   Users can delete existing segments directly from the expanded card view, with confirmation.
    *   Segment reordering via drag-and-drop is available.
    *   Changes made in the card view (add, delete, reorder, content edits) trigger an immediate save.

### 4. Onboarding & Tutorial Updates

*   **Revised Tutorial Flow (`src/app/tutorial/page.tsx`)**:
    *   New users are now prompted to select an Application Mode as the first step after the initial welcome.
    *   After mode selection, users are asked if they want mode-specific mock data provisioned.
    *   Planner Name setup follows.
    *   The tutorial content itself has been updated to use dynamic labels and explain features in the context of the selected mode.
    *   Fixed redirection logic in `AuthContext.tsx` to ensure new users are correctly routed to the tutorial page first.
*   **Mode-Aware Mock Data**:
    *   `src/lib/mockData.ts` (`provisionMockEpisodes`) now accepts the `currentMode` and generates mock item titles and notes tailored to that mode.
    *   The segment structure for these mock items is also based on the `MODE_SPECIFIC_DEFAULT_SEGMENTS` for the selected mode.

### 5. Form Enhancements in Episode Editor

*   **Dynamic Labels & Placeholders (`EpisodeForm.tsx`)**:
    *   All field labels for item numbers (e.g., "Track #", "Chapter #"), dates (e.g., "Recording Scheduled", "Shoot Scheduled", "Launch Date"), guest-equivalent fields (e.g., "Featured Artist", "Key Cast"), and detail-equivalent fields (e.g., "Studio/Producer", "Location/Set") are now dynamic based on `currentMode`.
    *   Input placeholders are also contextual.
    *   The "No Season" checkbox label can be overridden by `currentMode.noSeasonCheckboxLabel` (e.g., "Single/EP Release" for Music Album mode).

### 6. UI Fixes & Polish

*   **Status Button Text Wrapping**: Resolved an issue where long, dynamic status names on dashboard card date buttons were being truncated. Text now wraps correctly.
*   **Login Page Logo Animation**: The pulsating animation for the logo on the login page (`src/app/page.tsx`) was updated to a square shape to better fit the square logo, and ensures the latest logo image is loaded.
*   **Error Resolution**: Fixed various import and runtime errors that occurred during recent refactoring, including issues with `SYSTEM_DEFAULT_LAYOUT_NAME_BASE` and `DEFAULT_MASTER_SEGMENT_TEMPLATES` usage by moving `getDefaultSegments` to `segmentUtils.ts` to break circular dependencies.
*   **Dashboard List View Styling**: "Published" and "Archived" section headers now have fixed styling (background, text color, text shadow) that is consistent across all themes.

### 7. Settings Page Reorganization
*   The "Application Mode" selector card on the General Settings page has been moved to appear after "Dashboard Preferences" and before "Reset Application Data".

## III. Current State

Plotform is now a significantly more versatile and personalized planning tool. The core architecture supports 21 distinct creative workflows, with the UI adapting its language and default structures accordingly. Key functionalities like item creation, editing, dashboard views, and settings are mode-aware. The onboarding process is streamlined to guide users through mode selection and setup. Switching modes now correctly clears old data and provisions new mode-specific samples.

## IV. Known Issues / Potential Next Steps

*   **Deep Mock Segment Content**: While mock item titles and notes are mode-aware, the actual *content* within the default segments of mock items is still somewhat generic. Further tailoring this per mode could enhance the onboarding experience.
*   **Kanban Visuals**: While Kanban column *titles* are dynamic, the icons and color-coding for these columns are still based on the internal generic status keys (planning, scheduled, etc.). These could potentially be made mode-specific if desired for even deeper visual customization.
*   **"Edit Structure" Page Philosophy**: The role of globally "Master Segment Templates" (`src/lib/segmentTemplatesStore.ts`) needs to be fully reconciled with the new mode-specific default segment system. Users might expect to customize the *default set* for a mode, rather than just creating global layouts.
*   **AI Prompt Generation**: The "AI Prompt for Ideas" feature generates a structured prompt. Future work could involve direct AI integration for content suggestions within the app.
*   **Advanced Export Customization**: Explore more tailored export formats based on the selected `AppMode`.
*   **Full Server-Side Metadata**: For SEO, the `generateMetadata` in individual episode pages is basic. A more robust solution would fetch episode titles server-side if this page were a Server Component.

This update lays a very strong foundation for continued development and refinement of Plotform's multi-mode capabilities.
