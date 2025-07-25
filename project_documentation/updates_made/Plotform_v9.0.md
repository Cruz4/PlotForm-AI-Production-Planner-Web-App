# Plotform v.9.0 - Change Log

**Date:** Mon, 29 Jul 2025 00:00:00 GMT

## I. Overall Summary

Plotform v.9.0 is a critical stability and user experience release. It definitively resolves the recurring Firestore permission errors by implementing a completely rewritten, robust set of security rules. It also introduces significant UI/UX enhancements to the dashboard, board view, and calendar, and corrects previously reported UI styling issues.

## II. Key Changes & Enhancements

### 1. Critical: Firestore Security Rules Overhaul
*   **Permissions Fixed:** The `FirebaseError: Missing or insufficient permissions` issue has been definitively resolved. The `firestore.rules` file has been completely rewritten to correctly handle owner-based data access for all collections, including `userCustomThemes`, `userWorkspaces`, and `episodeVersions`. Queries and individual document reads/writes are now properly secured, allowing all features (like custom themes) to function as intended.

### 2. UI & Styling Fixes
*   **Button Hover States:** The hover state for all buttons has been corrected and standardized. All buttons will now change to the theme's `primary` color on hover, as requested.
*   **Card Hover State Removed:** The unwanted hover highlight effect on dashboard episode cards has been removed.
*   **Season Title Alignment (Definitive Fix):** The recurring alignment issue with season headers in the dashboard list view has been permanently resolved. The final, stable solution involves composing the component using Radix UI's `AccordionPrimitive` primitives directly. The `AccordionPrimitive.Trigger` is a `<button>` that acts as a flex container. Inside it, a `<div>` for the title and icon is set to `flex-1` (to grow and fill space) and `justify-center` (to center its contents). This robust Flexbox structure guarantees correct centering while keeping the chevron and delete icons properly aligned to the sides.

### 3. Dashboard and Board View Enhancements
*   **Season Grouping:** The "Published" and "Archived" sections on the Dashboard List view are now grouped by Season using accordions, mirroring the structure of the "Active" items for a consistent experience.
*   **Board View Organization:** The Kanban Board columns are now also grouped by Season, making it much easier to manage large projects with multiple seasons/parts within each workflow stage.

### 4. Calendar Page Upgrade
*   **Event Filtering:** The calendar page now includes checkboxes to filter events by status (Scheduled, Recorded, Uploaded), allowing users to focus on what's most important to them.
*   **Interactive Day Details:** Clicking a date on the calendar now shows a detailed list of all events occurring on that specific day in a side panel.

### 5. PDF Export Improvements
*   **Dynamic Layout:** The PDF export logic has been improved to remove unnecessary page breaks and white space, resulting in a more compact and professional-looking document.
*   **Footer Fix:** The export's footer is no longer cut off and will now display correctly on the final page.

### 6. Build Stability
*   **Error Resolution:** Addressed a TypeScript error related to the ProTipCard's `episodeContext` that was causing build failures.
*   **Duplicate File Cleanup:** Cleared the contents of duplicate configuration files found in the `src` directory to prevent potential build conflicts.
