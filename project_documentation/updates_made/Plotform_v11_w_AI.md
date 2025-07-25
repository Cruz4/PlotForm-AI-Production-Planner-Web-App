# Plotform v.11.0 w/ AI - Change Log

**Date:** ${new Date().toUTCString()}

## I. Overall Summary

This version represents a significant refinement of the user experience and documentation. It ensures all user-facing labels and terminology are clear and non-technical, overhauls the application's core documentation to reflect its latest features (including client-side AI), and fixes UI bugs related to the guided tour.

## II. Key Changes & Enhancements

### 1. User-Friendly Labeling & Terminology
*   **Global Terminology Update:** The application's documentation (`BLUEPRINT.md`, `README.md`) has been updated to remove technical database field names like `ownerHostDisplayName`. The documentation now consistently refers to these concepts using user-friendly terms like "Your Username" and "Collaborator," ensuring the app's philosophy is clear.
*   **Export Clarity:** While the underlying JSON exports still use the technical field names for data consistency, the user-facing experience (UI, PDF exports) now exclusively uses the user's custom-defined "Username" and the collaborator's display name, providing a clean and professional output.

### 2. Documentation Overhaul
*   **Updated `BLUEPRINT.md`:** The technical blueprint has been significantly updated to accurately reflect the current application architecture. This includes:
    *   A detailed description of the **client-side AI Plan Generator**.
    *   An explanation of the **Structured Plan Importer** for adding content from Markdown or JSON files.
    *   Revised feature flow descriptions using user-friendly terminology.
*   **New Evaluation File:** A new `PLOTFORM_EVALUATION_V11_AI.md` file has been created to provide a fresh analysis of the app's strengths and unique selling propositions, with a focus on its new AI capabilities.
*   **Updated `README.md`:** The main README has been updated to lead with the AI Plan Generator as a core feature and to correctly state that the AI implementation is client-side.
*   **Changelog:** This file (`Plotform_v11_w_AI.md`) has been created to document these changes.

### 3. Tutorial & Tour Fixes
*   **Simplified Tutorial Page:** The "How to Use" guide (`src/app/tutorial/page.tsx`) has been reviewed and its language simplified to be more accessible and less technical.
*   **Tour Highlight Box Adjustment:** The vertical offset for the "Export/Import Data Files" step in the Settings page guided tour has been adjusted (raised by 3 pixels) for better visual alignment, as requested.
