
# Plotform - Application Blueprint

## 1. Introduction

This document provides a technical overview of the Plotform application, detailing its architecture, data models, core feature flows, and key technologies. It serves as a reference for developers and anyone interested in the technical aspects of the application. Plotform is designed to be a highly adaptable planning tool for various creative projects, achieved through its "Application Modes" system and enhanced by a client-side AI Plan Generator.

## 2. Architecture Overview

Plotform is a web application built with the following primary technologies:

-   **Frontend Framework:** Next.js (App Router)
-   **UI Library:** React
-   **Component Library:** ShadCN UI Components
-   **Styling:** Tailwind CSS
-   **Generative AI:** Google Generative AI (Client-Side Implementation)
-   **Backend & Database:** Firebase (Authentication, Firestore)
-   **State Management:** React Context API (`AuthContext`, `EpisodeContext`, `UserSettingsContext`, `CustomThemeContext`, `ModeContext`)
-   **Deployment:** Firebase App Hosting

The application primarily uses client-side rendering for dynamic content and interactivity, leveraging Next.js server components for layouts and initial page structures where appropriate. A core feature is its "Application Modes" system, which allows users to tailor the app's terminology and default structures. Another key feature is the **client-side AI Plan Generator**, which uses a public API key to interact directly with the Google Generative AI service, avoiding the need for a complex backend AI setup.

## 3. Key Data Models (`src/types/index.ts`)

The core data structures of the application are:

-   **`User`**: Standard Firebase user object with UID, email, displayName, photoURL.
-   **`Segment`**: Represents a single segment/part within an "episode" (the main content unit, label varies by mode).
    -   `id`: Unique identifier (UUID v4).
    -   `title`, `subtitle?`.
    -   `host1Notes`, `host1Links`, `host1AudienceSuggestions`, `host1Quote?`, `host1Author?`: Content specific to the primary user (labeled by their "Username" preference).
    -   `host2Notes`, `host2Links`, `host2AudienceSuggestions`, `host2Quote?`, `host2Author?`: Content specific to an imported collaborator (labeled by `importedHostDisplayName`).
-   **`Episode`** (Note: "Episode" is the internal type name; UI labels are dynamic based on `AppMode`):
    -   `id`: Unique identifier.
    -   `title`, `episodeNumber` (dynamic label, e.g., "{Episode Label} #").
    *   `seasonNumber?`, `seasonName?`: Optional fields for grouping items.
    -   `createdAt`, `updatedAt`: Timestamps (milliseconds).
    -   `createdBy`: UID of the user who created the item.
    -   `collaborators`: Array of UIDs of users who have access (includes creator).
    -   `segments`: Array of `Segment` objects.
    -   `isArchived?`, `isFavorite?`.
    -   `dateScheduledForRecording?`, `dateRecorded?`, `dateUploaded?`: Timestamps for tracking production status. These fields map to dynamic status labels based on the selected `AppMode`.
    -   `specialGuest?`: Stores data for the dynamically labeled "guest" field (e.g., "Special Guest", "Featured Artist").
    -   `lunchProvidedBy?`: Stores data for the dynamically labeled "detail" field (e.g., "Sponsor", "Studio/Producer").
    -   `episodeNotes?`: General notes for the item.
    -   `status?`: (`planning` | `scheduled` | `editing` | `published` | `archived`) - Internal generic status key. The displayed status label is derived from `AppMode.statusWorkflow`.
    -   `ownerHostDisplayName?`: The creating user's "Username" (from `userPreferences.host1DisplayName`) at the time of sharing/exporting. This provides a user-friendly label for their content when it's imported by a collaborator.
    -   `importedHostDisplayName?`: When an item is imported, this stores the `ownerHostDisplayName` from the source, used to label the collaborator's content.
    -   `isMock?`: Boolean flag to identify sample items provisioned for new users.
    -   `linkedFollowUpId?`, `linkedPrequelId?`: IDs for linking related items.
    -   `coverImageUrl?`: URL for a cover image.
-   **`SegmentTemplate`**: Defines the structure of a master segment type for a specific `AppMode`. The application uses `MODE_SPECIFIC_DEFAULT_SEGMENTS` (in `src/lib/constants.ts`) as the primary source for available segment types for each `AppMode`.
-   **`EpisodeLayout`**: A user-saved arrangement of segments.
-   **`EpisodeVersion`**: Represents a historical snapshot of an episode, saved automatically.
-   **`UserThemeSettings`**: Stores user-specific settings (selected theme, selected app mode, tutorial/mock data status).
-   **`UserPreferences`**: Stores user-specific preferences (active default layout, custom "Username", custom "Planner Name").
-   **`AppMode`**: Defines the terminology, workflow labels, and default structures for one of the 21 available creative project types.
-   **`UserCustomTheme`**: Stores user-created themes with their name and custom color hex values.
-   **`UserWorkspace`**: Stores a named snapshot of a user's entire workspace for backup and project switching.
-   **`CustomTask`**: Stores user-created to-do items for the calendar.

## 4. Firebase Firestore Structure

-   **`episodes/{episodeId}`**: Stores individual "episode" documents. Security rules grant write access to users in the `collaborators` array.
-   **`episodeVersions/{versionId}`**: Stores historical versions of episodes.
-   **`episodeLayouts/{layoutId}`**: Stores user-created custom layouts.
-   **`tasks/{taskId}`**: Stores user-created custom tasks for the calendar.
-   **`userPreferences/{userId}`**: Stores user-specific preferences.
-   **`usersettings/{userId}`**: Stores user-specific settings.
-   **`userCustomThemes/{themeId}`**: Stores user-created custom color themes.
-   **`userWorkspaces/{workspaceId}`**: Stores named snapshots of a user's entire workspace data.
-   **Security Rules (`firestore.rules`):** Rules are owner-centric, enforcing that users can only access their own data by matching `request.auth.uid` with a `userId` or `createdBy` field in the document.

## 5. Core Feature Flows

### 5.1. AI-Assisted Planning
-   **AI Plan Generator (Dashboard):** A user provides a text prompt (e.g., "a podcast about ancient Rome"). The client-side AI generates a complete, structured plan with multiple episodes and segments, which can be added directly to the dashboard.
-   **AI Content Polish (Editor):** Within the full editor for an item, a user can trigger an AI assistant. The AI reads the existing content (title, notes, segments) and provides polished and expanded suggestions. The user can review these suggestions side-by-side with their original content and choose to apply them. This feature also supports locking certain segments to iteratively refine the plan.

### 5.2. Dashboard Views
-   **List View:**
    -   Displays projects as cards, grouped into collapsible `Season` accordions.
    -   Features robust search, sorting, and filtering capabilities.
    -   **Expanded Card View:** Clicking an expand icon reveals the full content of the card for inline editing. This includes a compact, left-aligned layout of segment shortcut buttons for quick navigation, editable fields for general notes, and pop-up date pickers. The layout is designed to be compact and efficient, with helpful tooltips on all interactive elements.
-   **Board View:** A Kanban-style board that automatically moves items between columns (`Planning`, `Scheduled`, `Editing`) based on their data state (e.g., content completion, dates set). Also grouped by `Season`.
-   **Timeline View:** A Gantt-style chart that visualizes items based on their scheduled start and end dates.

### 5.3. Rich Text Editing & Slash Commands
-   The primary content area for each segment (`host1Notes`) has been upgraded from a plain `textarea` to a rich text editor based on Tiptap.
-   Users can now format text (headings, bold, lists).
-   Typing `/` on a new line triggers a "slash command" menu for quick formatting actions.

### 5.4. Collaboration & Relational Linking
-   **Share/Import:** Users can share items via links or JSON files, with content being intelligently merged.
-   **Relational Linking:** A feature allowing users to create explicit links between any two items in their workspace, managed in the full editor.

## 6. Styling Approach
-   ShadCN UI components and Tailwind CSS.
-   `globals.css` defines CSS variables for multiple color themes (each with light/dark modes).
-   User-created custom themes are injected dynamically.

## 7. State Management
-   React Context API is used for global state: `AuthContext`, `EpisodeContext`, `UserSettingsContext`, `CustomThemeContext`, `ModeContext`.
-   Local component state (`useState`, `useReducer`) is used for UI and form data.
