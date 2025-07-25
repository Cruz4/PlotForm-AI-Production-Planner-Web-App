# Plotform v.13.0 - Change Log

**Date:** ${new Date().toUTCString()}

## I. Overall Summary

This version focuses on significant UI/UX enhancements to the Dashboard's expanded episode card, bringing its layout and functionality closer to the user's design specifications. Key changes include a more compact and intuitive layout for segment shortcuts and calendar buttons, the addition of tooltips for better usability, and the display of the item's creation date. All relevant documentation has been updated to reflect these improvements.

## II. Key Changes & Enhancements

### 1. Episode Card UI Overhaul (Dashboard List View)

The expanded view of an episode card in `src/components/dashboard/EpisodeCard.tsx` has been substantially refined:

*   **Segment Shortcut Buttons:** The grid layout for segment shortcut buttons has been replaced with a more compact `flex-wrap` layout. This ensures the buttons are only as wide as their text content and are tightly clustered with reduced vertical padding, as per the user's visual reference.
*   **Calendar Button Refinement:** The date picker buttons are now styled as compact, horizontal popovers, significantly reducing the vertical space they occupy on the card while remaining centered under the progress bar.
*   **"Created Date" Display:** The date an item was created is now displayed in the card header, next to the "Overall Progress" text, providing more context at a glance.
*   **Guest/Detail Alignment:** The "Guest" and "Detail" fields are now correctly aligned to the start and end of their container using `justify-between` for a cleaner look.
*   **Comprehensive Tooltips:** Tooltips have been added to nearly every interactive element on the card (expand button, favorite star, status badge, date buttons, etc.) to provide clear explanations of their function on hover.

### 2. Documentation & Tour Updates

*   **New Changelog:** This file (`Plotform_v13.0.md`) has been created to log these changes.
*   **Updated `BLUEPRINT.md`:** The technical blueprint has been updated to accurately describe the new, more refined layout and features of the dashboard episode cards.
*   **Updated "How to Use" Guide:** The tutorial page (`src/app/tutorial/page.tsx`) has been updated to reflect the latest UI changes, ensuring new users have an accurate guide.
*   **Dashboard Tour Validation:** The `data-tour-id` selectors used by the guided tour on the dashboard (`src/app/dashboard/page.tsx`) have been verified to ensure they still point to the correct elements after the recent layout adjustments, preventing the tour from breaking.
