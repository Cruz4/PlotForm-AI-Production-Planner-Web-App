
# PlotForm - Application Blueprint

## 1. Introduction

This document provides a technical overview of the PlotForm application, detailing its architecture, data models, core feature flows, and key technologies. It serves as a reference for developers. PlotForm is a highly adaptable, AI-powered planning tool for various creative projects.

## 2. Architecture Overview

-   **Frontend Framework:** Next.js (App Router)
-   **UI Library:** React with ShadCN UI Components & Tailwind CSS
-   **Generative AI:** Google Generative AI (Client-Side Implementation)
-   **Backend & Database:** Firebase (Authentication, Firestore)
-   **State Management:** React Context API
-   **Deployment:** Firebase App Hosting

The application uses client-side rendering for interactivity. Core features include "Application Modes" to tailor the UI, a client-side AI Plan Generator, and robust collaboration tools like Team Workspaces.

## 3. Key Data Models (`src/types/index.ts`)

-   **`User`**: Firebase user object (UID, email, etc.).
-   **`Segment`**: A single part of a project (e.g., a chapter, a scene). Includes fields for title, content, links, and notes for both the primary user and a collaborator.
-   **`Episode`**: The main content unit (e.g., an episode, a chapter). Contains title, number, dates, segments, and metadata like `teamId`, `isAiGenerated`, and relational links (`linkedPrequelId`, `linkedFollowUpId`).
-   **`Team`**: Represents a collaborative workspace with a name, owner, and a list of `TeamMember` objects.
-   **`TeamMember`**: A user within a team, defined by their UID, email, and role (`owner`, `editor`, `viewer`).
-   **`PlannerPal`**: A two-way connection between users for accountability and activity sharing.
-   **`PublicActivity`**: A log of public actions (like publishing an episode) visible to Planner Pals.
-   **`Share`**: Represents an item shared from one user to another's inbox.
-   **`UserPreferences` / `UserSettings`**: Documents storing user-specific settings like their chosen theme, default layout, custom username, etc.
-   **`CustomTask`**: A to-do item with a due date for the calendar.

## 4. Firebase Firestore Structure

-   **`episodes/{episodeId}`**: Stores individual project items.
-   **`teams/{teamId}`**: Stores team data, including the `members` array used for security rules.
-   **`users/{userId}`**: Stores public user profile information.
-   **`plannerPals/{palId}`**: Stores the connection between two users.
-   **`publicActivities/{activityId}`**: Stores the activity feed events.
-   **`shares/{shareId}`**: Stores inbox items.
-   **`tasks/{taskId}`**: Stores user-created calendar tasks.
-   Other collections like `episodeLayouts`, `userPreferences`, `usersettings`, etc., store user-specific configurations.
-   **Security Rules (`firestore.rules`):** Enforce owner-based access for personal data and role-based access for team data.

## 5. Core Feature Flows

### 5.1. AI-Assisted Planning
-   **AI Plan Generator (Dashboard):** A user provides a text prompt (e.g., "a podcast about ancient Rome"). The client-side AI generates a complete, structured plan with multiple episodes and segments.
-   **AI Content Polish (Editor):** Within the full editor, an AI assistant reads existing content and provides polished suggestions. Users can lock good suggestions and regenerate others.

### 5.2. Collaboration
-   **Team Workspaces:** Users can create teams, invite members, and assign roles. Episodes created within a team are accessible to all team members according to their permissions.
-   **Planner Pals:** Users can send connection requests. Once accepted, they can see each other's public activities (e.g., when an episode is published) on the "Community" page.
-   **Inbox Sharing:** Users can share a specific project with another user, who receives it in their inbox and can choose to accept it (creating a copy in their own workspace).

### 5.3. Dashboard & Views
-   **List View:** Displays projects as expandable cards for quick inline editing.
-   **Board View:** A Kanban board that automatically moves projects through stages based on data completion (e.g., dates set, content filled).
-   **Timeline View:** A Gantt chart visualizing projects based on their scheduled dates.

### 5.4. Personalization & Management
-   **Application Modes:** Users can choose from over 20 project types, which adapts the app's terminology and default structures.
-   **Custom Themes & Layouts:** Users can create their own color themes and save reusable project structures.
-   **Data Management:** Users can save/load snapshots of their entire workspace or export/import data via files.
-   **Personal Analytics:** A dedicated page shows users insights into their productivity, such as their average time to complete a project and their most active days.
