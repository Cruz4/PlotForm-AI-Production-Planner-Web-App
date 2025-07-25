
# PlotForm Ai Production Planner - Your Collaborative AI-Powered Planning Tool

PlotForm Ai Production Planner is a web application designed to streamline the content planning process for creative teams and individuals. It provides a collaborative environment to create, manage, and organize your projects from idea to publication, leveraging Firebase for backend services and client-side AI for intelligent planning assistance.

## Core Features:

- **User Authentication:** Secure login with Email/Password and Google OAuth. New users are guided through a setup wizard and an in-app tour.
- **AI-Powered Planning:**
    - **AI Plan Generator:** Start from a single idea. Enter a prompt like "a 5-part podcast on ancient Rome" and let the AI generate a complete, structured plan with multiple items and detailed segments.
    - **AI Content Polish:** In the editor, use the AI assistant to refine and expand upon your existing notes and scripts, with the ability to lock good suggestions and regenerate others.
- **Adaptive Workspace (Application Modes):** Choose from over 20 project types (Podcast, Book, Film, Marketing Campaign, etc.). The app tailors its terminology, default structures, and workflow to match your specific creative endeavor.
- **Dynamic Dashboard:** A central hub providing an overview of all your projects with multiple views:
    - **List View:** Robust search, sorting, and filtering with expandable cards for quick inline editing of all content without leaving the dashboard.
    - **Automated Board View:** A visual Kanban board that automatically moves projects through stages like "Planning" and "Editing" based on data completion (e.g., content filled, dates set).
    - **Timeline View:** A Gantt-style chart for visualizing your production schedule.
- **Full Project Editor:**
    - Detailed, segment-based planning for each item.
    - View a collaborator's content side-by-side with your own.
- **Advanced Collaboration:**
    - **Team Workspaces:** Create shared workspaces for your team. Invite members and assign roles (Owner, Editor, Viewer) to collaborate on projects in real-time.
    - **Planner Pals & Community:** Connect with other creators as "Planner Pals" to see a feed of their public activities and stay motivated.
    - **Inbox Sharing:** Share a specific item with another user, who receives it in their inbox and can accept it to add a copy to their own workspace.
- **Data & Customization:**
    - **Personal Analytics:** Get data-driven insights into your creative process, including your average time to publish and most productive days.
    - **Workspace Snapshots:** Save and load named snapshots of your entire workspace—all items, layouts, and settings.
    - **Version History:** Automatically saves versions of an item every time you save, allowing you to review and revert to previous states.
    - **Custom Layouts & Themes:** Save common segment structures as layouts and create your own color themes.
- **Versatile Export Options:**
    - Generate a printable **PDF** of your project plan.
    - Export your plan to **Markdown** or structured **JSON** data.

## Technical Details:

- **Framework:** Next.js (App Router)
- **UI:** React, ShadCN UI Components, Tailwind CSS
- **AI:** Google Generative AI (Client-Side)
- **Backend & Database:** Firebase (Authentication, Firestore)
- **State Management:** React Context API
- **Deployment:** Firebase App Hosting

## Project Documentation

For more detailed information on setup, architecture, and troubleshooting, please refer to the files in this project:

- **`BLUEPRINT.md`**: A deep dive into the application's architecture, data models, and feature flows.
- **`HOW_TO_FIX_PERMISSIONS.md`**: Step-by-step instructions for resolving common Firebase and Google Cloud permission errors.
