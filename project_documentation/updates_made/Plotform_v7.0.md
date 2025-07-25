# Plotform v.7.0 - Change Log

**Date:** Mon, 22 Jul 2025 00:00:00 GMT

## I. Overall Summary

Plotform v.7.0 significantly enhances user data management and workspace flexibility. Key additions include a robust in-app "Save Current State" / "Load Full Project" system, allowing users to create named snapshots of their entire workspace. This version also introduces Episode Version History for tracking changes to individual items. Terminology has been refined for a more generic user experience (e.g., "Username" instead of "Host 1 Label", "Planner Name" instead of "Show Name"). Data saving mechanisms have been clarified, and a critical Firestore index issue for workspaces has been addressed for improved performance and stability.

## II. Key Changes & Enhancements

### 1. Feature: Workspace Management (Save Current State / Load Full Project)

*   **Description:** Users can now save and load named snapshots of their entire PlotForm environment. This includes all their items (episodes), custom layouts, user preferences (username, planner name, default layout), user settings (theme, selected mode, tutorial status), and custom themes.
*   **Functionality:**
    *   **Save Current State:**
        *   Accessible via Navbar dropdown (opens a dialog to name the state) and from the General Settings page.
        *   Gathers all current user data and stores it as a new `UserWorkspace` document in Firestore.
        *   Toast message confirms save and notes that the updated list is visible in General Settings.
    *   **Load Full Project:**
        *   Accessible via Navbar dropdown (links to General Settings) and directly on the General Settings page.
        *   Lists all saved states, showing name, save date, and a preview of item count.
        *   Loading a state replaces the user's current entire workspace with the data from the chosen snapshot. A confirmation dialog warns the user about this destructive action.
*   **Data Model:** Introduced `UserWorkspace` type in `src/types/index.ts`.
*   **Firestore:** New `userWorkspaces` collection created.
*   **Store Logic:** New `src/lib/userWorkspacesStore.ts` handles CRUD operations for workspaces and the logic for applying a workspace.
*   **UI:**
    *   Navbar: "Save Current State" and "Load Full Project" options added.
    *   Settings Page (`src/app/settings/page.tsx`): New "Manage Project/Planner States" card for saving, listing, loading, and deleting saved states. Card `id="manage-workspaces"` added for direct linking.

### 2. Feature: Episode Version History

*   **Description:** The system now automatically saves a version of an episode's key content (title, notes, segments) every time the episode is saved or created.
*   **Functionality:**
    *   Accessible from the full episode editor page (`src/app/dashboard/episode/[episodeId]/page.tsx`) via a "Version History" button.
    *   A dialog lists all saved versions for that episode, ordered by timestamp.
    *   Users can select a version and revert the current episode's content to that version. This revert action itself creates a new version.
*   **Data Model:** Introduced `EpisodeVersion` type in `src/types/index.ts`.
*   **Firestore:** New `episodeVersions` collection. Index added to query versions by `episodeId` and `versionTimestamp`.
*   **Store Logic:** New `src/lib/episodeVersionStore.ts` for saving and retrieving versions. `src/lib/episodeStore.ts` was updated to call `saveEpisodeVersion` on episode save/add and to delete versions when episodes are deleted.

### 3. UI/UX: Terminology & Clarity Updates

*   **"Username"**:
    *   The term "Host 1 Label" has been replaced with "Your Preferred Username" in the UI (General Settings).
    *   Default value is now "My Username" or the user's Firebase display name.
    *   References in AI prompt generator and export functions updated accordingly.
*   **"Planner Name" / "Project Name"**:
    *   The term "Planner/Show Name" has been clarified to "Planner Name" or "Project Name" in settings and tutorial descriptions. "Show name" references removed.
*   **Navbar Dropdown Renaming:**
    *   "Save Project/Planner" is now "Save Current State".
    *   "Load Project/Planner" is now "Load Full Project".
*   **Settings Page Data Management Sections:**
    *   The "Manage Project/Planner States" (in-app snapshots) and "Export/Import Your Data File" (file-based operations) cards are now grouped together.
    *   Their descriptions have been updated to clearly differentiate their purposes.
*   **Save Mechanisms Clarification:**
    *   Added text to the Settings page (Data & Workspace Management section) and the Tutorial page to explain the difference between frequent automatic saves of individual item edits versus the manual "Save Current State" feature for full workspace snapshots.

### 4. Bug Fixes & Improvements

*   **Firestore Index for Workspaces:** Added the necessary composite index to `firestore.indexes.json` for querying the `userWorkspaces` collection by `userId` and ordering by `savedAt` (descending), including `__name__`. This resolves `FirebaseError: The query requires an index.`
*   **Navbar Save Reflection (Improved Feedback):** The Navbar "Save Current State" success toast now clarifies that the updated list of saved states will be visible in General Settings.
*   **Tutorial Stuck State:** Fixed an issue in `src/app/tutorial/page.tsx` where the "Name Your Planner" step could get stuck in an infinite loading state by removing `isProcessing` from the main `useEffect` dependency array.
*   **Build Error `ENOENT` for `page.js`:** Addressed by ensuring build errors (like previous type errors) are fixed, as this typically indicates an incomplete build.
*   **Build Error: `USER_WORKSPACES_COLLECTION` not exported:** Fixed by exporting the constant from `src/lib/userWorkspacesStore.ts`.
*   **Logo Consistency:** Ensured `public/logo.png` is consistently used in `src/app/layout.tsx` metadata and `public/manifest.webmanifest`.
*   **Landing Page Logo Ripple:** Reinstated a distinct version of the `logo-ripple` animation in `tailwind.config.ts`.

## V. Relevant Files Modified/Added (Illustrative - many files touched)

*   `firestore.indexes.json` (New index for `userWorkspaces`, `episodeVersions`)
*   `src/types/index.ts` (Added `UserWorkspace`, `EpisodeVersion` types)
*   `src/lib/userWorkspacesStore.ts` (New file - core logic for workspace save/load)
*   `src/lib/episodeVersionStore.ts` (New file - core logic for episode versioning)
*   `src/components/layout/Navbar.tsx` (UI text, save dialog logic, toast message update)
*   `src/app/settings/page.tsx` (UI text, layout, new workspace management UI, description updates)
*   `src/app/tutorial/page.tsx` (Clarification on save types, fixed loading state bug)
*   `src/lib/episodeStore.ts` (Integrated calls to `saveEpisodeVersion`, updated delete functions)
*   `src/lib/dataUtils.ts` (Updated export/import to align with new workspace concepts)
*   `src/lib/episodeLayoutsStore.ts` (Adjusted default `host1DisplayName`)
*   `src/app/layout.tsx` (Updated icon metadata)
*   `public/manifest.webmanifest` (Updated icon paths)
*   `tailwind.config.ts` (Reinstated logo ripple animation)
*   `project_documentation/BLUEPRINT.md` (Updated with new data models and features)

This version provides significantly more control, safety, and clarity for users managing their creative projects in PlotForm.
