# Plotform v.10.0 - Change Log

**Date:** ${new Date().toUTCString()}

## I. Overall Summary

Plotform v.10.0 introduces a major upgrade to the **Calendar** page, transforming it into a fully-featured production hub. This version also brings significant organizational enhancements to the **Board View** and fixes several UI and data-related bugs for a more stable and intuitive user experience.

## II. Key Changes & Enhancements

### 1. Calendar Page Overhaul (Major Feature)

The Calendar page (`src/app/calendar/page.tsx`) has been completely redesigned for better usability and functionality:

*   **Enlarged Interactive Calendar**: The calendar view is now much larger, making it easier to see and interact with.
*   **Production Heatmap**: Days on the calendar are now visually highlighted based on the number of events scheduled, providing an instant "heatmap" of your busiest production days.
*   **New "Agenda" View**: Users can switch from the traditional month grid to a chronological "Agenda" list, showing all upcoming project dates and tasks in order.
*   **Custom Tasks & Deadlines**: A new "Add Task" feature allows users to create custom to-do items with due dates directly on the calendar, which are stored in a new `tasks` collection in Firestore.
*   **Interactive Day Details Panel**: Clicking a date on the month view now opens a side panel displaying a detailed list of all events and tasks for that specific day.
*   **Interactive Popups**: From the Agenda or Day Details views, users can now view full details of an episode or task in a popup modal without leaving the calendar page. Segments within the episode popup are also clickable for even deeper inspection.
*   **iCal Export**: A new "Export to Calendar" button generates a standard `.ics` file, allowing users to easily import their entire schedule into Google Calendar, Apple Calendar, or Outlook.

### 2. Board View Enhancement

*   **Season Grouping**: The Kanban Board (`src/components/dashboard/DashboardBoardView.tsx`) now groups items within each column (e.g., Planning, Scheduled) into collapsible "Season" accordions. This greatly improves organization and makes it easier to manage large projects with multiple seasons or parts.

### 3. UI, UX, and Bug Fixes

*   **Correct Mock Data Generation**: The mock data provisioning logic (`src/lib/mockData.ts`) has been fixed to correctly reset episode numbers for each new season, providing a more realistic initial dataset.
*   **Editor Sidebar Navigation**: The left-hand navigation in the full episode editor (`src/app/dashboard/episode/[episodeId]/page.tsx`) has been improved to wrap long segment titles instead of truncating them, and its width was adjusted to prevent layout overlap.
*   **Expanded Card Sticky Headers**: In the dashboard list view, the headers for individual segments within an expanded card are now "sticky," remaining visible as the user scrolls through that segment's content (`src/components/dashboard/DashboardListView.tsx`).
*   **Permissions & Data Loading Fixes**:
    *   Resolved a crash on the Calendar page caused by an incorrect function name (`getAllEpisodesForUserFromDb`).
    *   Added the necessary Firestore security rules for the new `tasks` collection to fix permission errors (`firestore.rules`).
    *   Fixed a bug in the episode editor where dragging a segment did not correctly flag unsaved changes.

## III. Documentation Updates
*   The **How to Use Guide** (`src/app/tutorial/page.tsx`) has been updated with a new section detailing the enhanced Calendar features.
*   The technical **BLUEPRINT.md** has been updated to include the new `tasks` data model and describe the new functionalities of the Calendar and Board views.
*   This file, **Plotform_v10.0.md**, has been created to log these changes.
