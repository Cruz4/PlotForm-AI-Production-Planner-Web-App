
'use client';

// A library of high-quality, mode-specific prompt templates for the AI Plan Generator.
// Placeholders like [Your Topic] are used to guide user customization.

type PromptLibrary = {
    [key: string]: string[];
};

const promptLibrary: PromptLibrary = {
    "Podcast": [
        "A 6-episode podcast season named '[Podcast Name]' about the cultural impact of [Your Topic]. Each episode should focus on a different decade, from the 70s to today, with a final episode speculating on the future.",
        "An interview-style podcast of 8 episodes focusing on [Industry/Field]. Each episode features an expert guest, with segments for their personal story, their biggest discovery, and a listener Q&A.",
        "A narrative nonfiction podcast series in 5 parts, titled '[Series Title]', investigating the mysterious disappearance of [Person/Object]. Structure it with an introduction, rising action with clues, a climax with a major revelation, and a concluding episode discussing the aftermath and theories.",
        "A solo-hosted educational podcast with 10 short episodes (10-15 minutes each) explaining [Complex Subject] to beginners.",
        "A comedy podcast where two hosts try a new [Activity, e.g., bizarre snack, retro video game] each week for 8 weeks. The plan should include segments for first impressions, hilarious mishaps, and a final rating.",
        "A historical storytelling podcast season of 7 episodes, focusing on the life of [Historical Figure]. Each episode should cover a significant period of their life, from childhood to their legacy.",
    ],
    "Book / Novel": [
        "A 20-chapter fantasy novel titled '[Book Title]' about a reluctant [Protagonist's Role] named [Character Name] who must master a lost form of magic to save their kingdom from a creeping blight.",
        "A 12-chapter science fiction mystery where a detective on a space station, [Detective's Name], must solve a murder where the only witness is the station's AI. The plan should include key plot points and character introductions for each chapter.",
        "A young adult contemporary novel of about 15 chapters, following [Protagonist's Name] through their senior year of high school as they deal with [Central Conflict, e.g., a family secret, a challenging competition].",
        "A historical fiction novel set during [Historical Period], following a character who gets involved in [Major Event]. Outline the plot across 25 chapters.",
        "A thriller novel about a software developer who discovers a dangerous secret in their company's code. Plan the story in three acts: The Discovery, The Chase, and The Confrontation.",
        "A romance novel with 18 chapters about two people who meet during a [Specific Situation, e.g., cross-country train trip, cooking competition] and must overcome [Obstacle].",
    ],
    "Movie / Film Project": [
        "A screenplay for a thriller movie titled '[Movie Title]'. The story is about a cryptographer who uncovers a digital conspiracy. The plan should outline the three acts: Act 1 introduces the character and the puzzle, Act 2 details the rising stakes and chase, and Act 3 is the final confrontation and resolution.",
        "A romantic comedy film where two rival chefs, [Chef 1 Name] and [Chef 2 Name], are forced to work together to save a historic restaurant. Outline the key scenes, including their initial conflict, the 'cooking together' montage, the misunderstanding, and the final romantic gesture.",
        "A sci-fi adventure film where a team of explorers discovers a new planet. Outline the major plot points: The Arrival, The Discovery of life, The First Contact Conflict, and The Escape.",
        "A horror movie script about a group of friends who rent an old house with a dark history. Plan the key scenes that build suspense, the major scares, and the final showdown.",
    ],
    "YouTube Series": [
        "A 4-part YouTube documentary series about [Historical Event]. The first video should set the context, the next two should cover the main events in detail, and the final video should analyze its long-term consequences.",
        "A 5-video YouTube series for a DIY channel, showing how to build a [Complex Project, e.g., custom PC desk]. Each video should be a clear step in the process, from planning and materials to final assembly and finishing touches.",
        "An 8-video educational YouTube series explaining the fundamentals of [Subject, e.g., astrophysics, digital marketing]. Each video should break down one core concept.",
        "A travel vlog series of 6 videos documenting a trip to [Country/City]. Plan each video around a specific theme or location.",
    ],
    "Course / Curriculum": [
        "A 5-module online course on '[Your Skill, e.g., Introduction to Python]'. Module 1 should be basics, Module 2-4 should cover core concepts with practical exercises, and Module 5 should be a final project that combines all the learned skills.",
        "A 10-lesson curriculum for a workshop on [Topic, e.g., public speaking]. Each lesson should have a clear objective, a main content section, and a practical activity.",
        "A 7-module course on creative writing, with modules on character development, plot structure, dialogue, world-building, and revision.",
    ],
    "Marketing Campaign": [
        "A 4-phase marketing campaign for the launch of a [Product Type, e.g., new energy drink]. Phase 1 is 'Teaser', Phase 2 is 'Launch Announcement' with influencer collaborations, Phase 3 is 'Customer Stories', and Phase 4 is a 'Special Offer' to drive final sales.",
        "A content marketing campaign for a SaaS company. Plan 8 blog posts, 4 YouTube videos, and 1 webinar around the central theme of [Theme, e.g., 'Boosting Team Productivity'].",
    ],
    "Music Album": [
        "A 10-track concept album for a [Genre, e.g., synth-pop] band. The album tells a story about [Concept, e.g., a journey through a futuristic city]. The plan should suggest a title and theme for each track, creating a cohesive narrative arc.",
        "A 12-track indie folk album focused on themes of nature and change. Each track should correspond to a month of the year.",
        "An 8-track EP for an electronic artist. The plan should outline the mood and BPM for each track, creating a progression from ambient opening to high-energy peak, and a cool-down.",
    ],
    "Default": [
        "A 5-part project exploring [Your Topic]. Part 1 should be an introduction. Parts 2-4 should be deep dives into specific sub-topics. Part 5 should be a summary and conclusion.",
        "A detailed 4-item plan to achieve [Your Goal]. Item 1 is 'Research & Planning'. Item 2 is 'Execution Phase 1'. Item 3 is 'Execution Phase 2'. Item 4 is 'Review & Finalize'.",
        "A 7-step plan for completing [Your Project]. Break down the project into seven distinct, actionable stages.",
        "A 3-phase project plan. Phase 1 is 'Discovery and Strategy'. Phase 2 is 'Development and Implementation'. Phase 3 is 'Launch and Review'.",
    ]
};

// Add more prompts for other modes
promptLibrary["Stage Play"] = [
    "A three-act stage play about a family reunion that unearths a long-held secret. Act 1: The cheerful arrival. Act 2: The secret is revealed. Act 3: The aftermath and resolution.",
];
promptLibrary["Vlog Series"] = promptLibrary["YouTube Series"]; // Use the same prompts
promptLibrary["Game Narrative"] = [
    "A 5-quest main storyline for an RPG. Quest 1 is the 'Call to Adventure'. Quest 2-4 are trials to gather [MacGuffins]. Quest 5 is the final boss battle.",
];
promptLibrary["Recipe Builder"] = [
    "A 7-step recipe for [Your Dish]. The steps should be: Ingredients, Prep Work, Cooking the Main Component, Preparing the Sauce, Combining, Plating, and Serving Suggestions.",
];
promptLibrary["Academic Paper"] = [
    "An academic paper on [Your Topic]. The plan should include sections for an Abstract, Introduction, Literature Review, Methodology, Results, Discussion, and Conclusion.",
];
promptLibrary["Pitch Deck"] = [
    "A 10-slide pitch deck for a startup called '[Startup Name]'. The slides should cover: Problem, Solution, Market Size, Product Demo, Business Model, Team, Competition, Financial Projections, and The Ask.",
];
promptLibrary["Challenge Tracker"] = [
    "A 30-day challenge to learn [New Skill]. Break it down into 4 weekly goals, with daily tasks for each week.",
];


export const getRandomPromptForMode = (modeName: string): string => {
    const promptsForMode = promptLibrary[modeName] || promptLibrary["Default"];
    if (!promptsForMode || promptsForMode.length === 0) {
        return "A project about...";
    }
    const randomIndex = Math.floor(Math.random() * promptsForMode.length);
    return promptsForMode[randomIndex];
};
