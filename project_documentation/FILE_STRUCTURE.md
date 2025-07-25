# Plotform - Project File Structure

This document outlines the complete file and folder structure for the Plotform application. Build artifacts, node modules, and redundant cache files have been omitted for clarity.

```
/
├── .env
├── .firebaserc
├── BLUEPRINT.md
├── HOW_TO_FIX_PERMISSIONS.md
├── README.md
├── apphosting.emulator.yaml
├── apphosting.yaml
├── components.json
├── example-episode-101-shared-by-host2.json
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
│
├── dataconnect/
│   ├── dataconnect.yaml
│   ├── connector/
│   │   ├── connector.yaml
│   │   ├── mutations.gql
│   │   └── queries.gql
│   └── schema/
│       └── schema.gql
│
├── dataconnect-generated/
│   └── js/
│       └── default-connector/
│           ├── README.md
│           ├── index.cjs.js
│           ├── index.d.ts
│           ├── package.json
│           ├── esm/
│           │   ├── index.esm.js
│           │   └── package.json
│           └── react/
│               ├── README.md
│               ├── index.cjs.js
│               ├── index.d.ts
│               ├── package.json
│               └── esm/
│                   ├── index.esm.js
│                   └── package.json
│
├── functions/
│   ├── .eslintrc.js
│   ├── package.json
│   ├── tsconfig.dev.json
│   ├── tsconfig.json
│   ├── lib/
│   │   ├── genkit-sample.js
│   │   └── index.js
│   └── src/
│       ├── genkit-sample.ts
│       └── index.ts
│
├── project_documentation/
│   ├── BLUEPRINT.md
│   ├── Business_Strategy_And_Valuation_QnA.md
│   ├── FILE_STRUCTURE.md
│   ├── HOW_TO_UPDATE_GITHUB.md
│   ├── Monetization_Strategy_7DayTrial_OneTimeFee.md
│   ├── PLOTFORMFLOW_EVALUATION.md
│   ├── PLOTFORM_EVALUATION.md
│   ├── PLOTFORM_STRATEGY_AND_MONETIZATION.md
│   ├── PlotformFlow_Strategy_And_Monetization.md
│   └── updates_made/
│       ├── Plotform_v.4.0.md
│       ├── Plotform_v.5.0.md
│       ├── Plotform_v6.0.md
│       ├── Plotform_v7.0.md
│       ├── Plotform_v8.0.md
│       └── Plotform_v9.0.md
│
├── public/
│   ├── ad-banner-nynp.png
│   ├── favicon.ico
│   ├── logo-192.png
│   ├── logo-512.png
│   ├── logo.png
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── fonts/
│       ├── Bungee-Regular.ttf
│       ├── MotleyForces-Regular.ttf
│       └── Royando-Regular.ttf
│
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   ├── page.tsx
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── signup/
    │   │       └── page.tsx
    │   ├── calendar/
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── dashboard/
    │   │   ├── error.tsx
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── board/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   └── episode/
    │   │       └── [episodeId]/
    │   │           ├── layout.tsx
    │   │           └── page.tsx
    │   ├── settings/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── segments/
    │   │       └── page.tsx
    │   └── tutorial/
    │       ├── layout.tsx
    │       └── page.tsx
    ├── components/
    │   ├── ThemeSelector.tsx
    │   ├── dashboard/
    │   │   ├── CompactEpisodeCard.tsx
    │   │   ├── DashboardBoardView.tsx
    │   │   ├── DashboardListView.tsx
    │   │   └── ProTipCard.tsx
    │   ├── episodes/
    │   │   ├── EpisodeForm.tsx
    │   │   ├── PublishedEpisodeModal.tsx
    │   │   └── SegmentEditor.tsx
    │   ├── kanban/
    │   │   ├── KanbanBoardClient.tsx
    │   │   └── KanbanColumn.tsx
    │   ├── layout/
    │   │   ├── AppClientBoundary.tsx
    │   │   ├── ClientOnly.tsx
    │   │   └── Navbar.tsx
    │   ├── tour/
    │   │   └── GuidedTour.tsx
    │   └── ui/
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── alert.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── menubar.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       └── toaster.tsx
    ├── contexts/
    │   ├── AuthContext.tsx
    │   ├── CustomThemeContext.tsx
    │   ├── EpisodeContext.tsx
    │   ├── ModeContext.tsx
    │   └── UserSettingsContext.tsx
    ├── hooks/
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    ├── lib/
    │   ├── constants.ts
    │   ├── dataUtils.ts
    │   ├── episodeData.ts
    │   ├── episodeLayoutsStore.ts
    │   ├── episodeStore.ts
    │   ├── episodeVersionStore.ts
    │   ├── firebase.server.ts
    │   ├── firebase.ts
    │   ├── markdownUtils.ts
    │   ├── mockData.ts
    │   ├── mockEpisodeDb.ts
    │   ├── modeIcons.tsx
    │   ├── modes.ts
    │   ├── pdfUtils.ts
    │   ├── segmentTemplatesStore.ts
    │   ├── segmentUtils.ts
    │   ├── taskAppIntegration.ts
    │   ├── themes.ts
    │   ├── userCustomThemesStore.ts
    │   ├── userWorkspacesStore.ts
    │   └── utils.ts
    └── types/
        ├── html2pdf.d.ts
        └── index.ts
```
