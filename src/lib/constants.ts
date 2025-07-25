
import type { Segment, EpisodeLayout, SegmentTemplate, AppMode, ModeSpecificSegmentTemplate } from '@/types';
// Removed imports for: getActiveDefaultLayoutId, getLayoutById from './episodeLayoutsStore';
// Removed imports for: getDefaultAppMode from './modes';

export const APP_NAME = 'PlotForm';
export const SYSTEM_DEFAULT_LAYOUT_NAME_BASE = "Default Structure"; // Base name

export const MODE_SPECIFIC_DEFAULT_SEGMENTS: Record<string, ModeSpecificSegmentTemplate[]> = {
    "Podcast": [
        { id: 'podcast-intro', title: 'Intro', subtitle: 'Opening remarks, theme music, and hook.', isDeletable: true },
        { id: 'podcast-main-topic', title: 'Main Topic', subtitle: 'Deep dive into the episode\'s core subject.', isDeletable: true },
        { id: 'podcast-interview', title: 'Interview', subtitle: 'Conversation with a guest.', isDeletable: true },
        { id: 'podcast-game-segment', title: 'Game Segment', subtitle: 'Interactive or fun segment, e.g., trivia.', isDeletable: true },
        { id: 'podcast-audience-qa', title: 'Audience Q&A', subtitle: 'Answering listener questions.', isDeletable: true },
        { id: 'podcast-outro', title: 'Outro', subtitle: 'Closing thoughts, call to action, credits.', isDeletable: true }
    ],
    "Movie / Film Project": [
        { id: 'movie-establishing-shot', title: 'Establishing Shot', subtitle: 'Sets the scene and location.', isDeletable: true },
        { id: 'movie-dialogue-a', title: 'Dialogue A', subtitle: 'Key conversation driving the plot.', isDeletable: true },
        { id: 'movie-action-sequence', title: 'Action Sequence', subtitle: 'A sequence of dynamic action.', isDeletable: true },
        { id: 'movie-close-up', title: 'Close-up', subtitle: 'Focus on a character or important detail.', isDeletable: true },
        { id: 'movie-transition-shot', title: 'Transition Shot', subtitle: 'Visually links two scenes.', isDeletable: true },
        { id: 'movie-montage', title: 'Montage', subtitle: 'A sequence of short clips to convey passage of time or development.', isDeletable: true },
        { id: 'movie-final-frame', title: 'Final Frame', subtitle: 'The concluding shot of the film.', isDeletable: true }
    ],
    "Book / Novel": [
        { id: 'book-opening-scene', title: 'Opening Scene', subtitle: 'Introduces characters and setting.', isDeletable: true },
        { id: 'book-conflict-introduction', title: 'Conflict Introduction', subtitle: 'The main problem or challenge is revealed.', isDeletable: true },
        { id: 'book-flashback', title: 'Flashback', subtitle: 'A scene from the past providing context.', isDeletable: true },
        { id: 'book-climax', title: 'Climax', subtitle: 'The most intense point of the story.', isDeletable: true },
        { id: 'book-twist', title: 'Twist', subtitle: 'An unexpected turn of events.', isDeletable: true },
        { id: 'book-resolution', title: 'Resolution', subtitle: 'The story\'s conflict is resolved.', isDeletable: true }
    ],
    "Stage Play": [
        { id: 'play-opening-monologue', title: 'Opening Monologue', subtitle: 'A character speaks their thoughts aloud.', isDeletable: true },
        { id: 'play-conflict-dialogue', title: 'Conflict Dialogue', subtitle: 'Characters discuss the central conflict.', isDeletable: true },
        { id: 'play-stage-action', title: 'Stage Action', subtitle: 'Significant physical actions or events on stage.', isDeletable: true },
        { id: 'play-comic-relief', title: 'Comic Relief', subtitle: 'A humorous scene to lighten the mood.', isDeletable: true },
        { id: 'play-emotional-climax', title: 'Emotional Climax', subtitle: 'The peak of emotional tension.', isDeletable: true },
        { id: 'play-curtain-call', title: 'Curtain Call', subtitle: 'Actors take their bows.', isDeletable: true }
    ],
    "Vlog Series": [
        { id: 'vlog-intro', title: 'Intro & Hook', subtitle: 'Catchy opening to grab attention.', isDeletable: true },
        { id: 'vlog-main-content', title: 'Main Content', subtitle: 'The core topic or activity of the vlog.', isDeletable: true },
        { id: 'vlog-montage', title: 'Montage Sequence', subtitle: 'Quick cuts to music showing an activity.', isDeletable: true },
        { id: 'vlog-call-to-action', title: 'Call to Action', subtitle: 'Ask viewers to like, subscribe, etc.', isDeletable: true },
        { id: 'vlog-outro', title: 'Outro', subtitle: 'Closing remarks and what\'s next.', isDeletable: true },
    ],
    "Fitness Program": [
        { id: 'fitness-warm-up', title: 'Warm-up', subtitle: 'Prepare the body for exercise.', isDeletable: true },
        { id: 'fitness-main-set-1', title: 'Main Set 1', subtitle: 'First block of primary exercises.', isDeletable: true },
        { id: 'fitness-rest', title: 'Rest Period', subtitle: 'Recovery time.', isDeletable: true },
        { id: 'fitness-main-set-2', title: 'Main Set 2', subtitle: 'Second block of primary exercises.', isDeletable: true },
        { id: 'fitness-cool-down', title: 'Cool-down', subtitle: 'Stretching and recovery.', isDeletable: true },
    ],
    "Course / Curriculum": [
        { id: 'course-learning-goal', title: 'Learning Goal', subtitle: 'What students will achieve.', isDeletable: true },
        { id: 'course-key-concept', title: 'Key Concept', subtitle: 'Explanation of a core idea.', isDeletable: true },
        { id: 'course-interactive-exercise', title: 'Interactive Exercise', subtitle: 'Hands-on activity for students.', isDeletable: true },
        { id: 'course-example-walkthrough', title: 'Example Walkthrough', subtitle: 'Demonstrating a process or solution.', isDeletable: true },
        { id: 'course-quiz', title: 'Quiz', subtitle: 'Assessment of understanding.', isDeletable: true },
        { id: 'course-summary', title: 'Summary', subtitle: 'Recap of the lesson\'s main points.', isDeletable: true },
        { id: 'course-next-steps', title: 'Next Steps', subtitle: 'Guidance for continued learning.', isDeletable: true }
    ],
    "YouTube Series": [
        { id: 'youtube-cold-open', title: 'Cold Open', subtitle: 'Quick, attention-grabbing start.', isDeletable: true },
        { id: 'youtube-intro', title: 'Intro', subtitle: 'Branding and series introduction.', isDeletable: true },
        { id: 'youtube-main-topic', title: 'Main Topic', subtitle: 'The core content of the video.', isDeletable: true },
        { id: 'youtube-live-demo', title: 'Live Demo', subtitle: 'Showing something in real-time.', isDeletable: true },
        { id: 'youtube-qa-section', title: 'Q&A Section', subtitle: 'Answering viewer questions.', isDeletable: true },
        { id: 'youtube-wrap-up', title: 'Wrap-up', subtitle: 'Summary and call to action.', isDeletable: true }
    ],
    "Magazine / Newsletter": [
        { id: 'magazine-editorial-note', title: 'Editorial Note', subtitle: 'Message from the editor.', isDeletable: true },
        { id: 'magazine-feature-article', title: 'Feature Article', subtitle: 'Main in-depth article.', isDeletable: true },
        { id: 'magazine-interview', title: 'Interview', subtitle: 'Q&A with a notable person.', isDeletable: true },
        { id: 'magazine-product-spotlight', title: 'Product Spotlight', subtitle: 'Review or feature of a product.', isDeletable: true },
        { id: 'magazine-opinion-column', title: 'Opinion Column', subtitle: 'A regular columnist\'s views.', isDeletable: true },
        { id: 'magazine-event-recap', title: 'Event Recap', subtitle: 'Summary of a recent event.', isDeletable: true }
    ],
    "Music Album": [
        { id: 'music-intro', title: 'Intro', subtitle: 'Opening instrumental or short piece.', isDeletable: true },
        { id: 'music-verse-1', title: 'Verse 1', subtitle: 'First lyrical section.', isDeletable: true },
        { id: 'music-hook', title: 'Hook', subtitle: 'The catchy chorus or main musical theme.', isDeletable: true },
        { id: 'music-bridge', title: 'Bridge', subtitle: 'Transitional musical section.', isDeletable: true },
        { id: 'music-verse-2', title: 'Verse 2', subtitle: 'Second lyrical section.', isDeletable: true },
        { id: 'music-hook-repeat', title: 'Hook (Repeat)', subtitle: 'Repeating the chorus.', isDeletable: true },
        { id: 'music-outro', title: 'Outro', subtitle: 'Concluding musical section.', isDeletable: true }
    ],
    "Event Planning": [
        { id: 'event-venue-scouting', title: 'Venue Scouting', subtitle: 'Research and selection of location.', isDeletable: true },
        { id: 'event-vendor-booking', title: 'Vendor Booking', subtitle: 'Catering, AV, entertainment.', isDeletable: true },
        { id: 'event-run-of-show', title: 'Run of Show', subtitle: 'Minute-by-minute event schedule.', isDeletable: true },
        { id: 'event-guest-registration', title: 'Guest Registration', subtitle: 'Managing attendees.', isDeletable: true },
        { id: 'event-post-event-survey', title: 'Post-Event Survey', subtitle: 'Gathering feedback.', isDeletable: true }
    ],
    "App Development": [
        { id: 'app-ui-design', title: 'UI Design', subtitle: 'User interface mockups and specifications.', isDeletable: true },
        { id: 'app-login-system', title: 'Login System', subtitle: 'Authentication and user accounts.', isDeletable: true },
        { id: 'app-database-setup', title: 'Database Setup', subtitle: 'Schema design and implementation.', isDeletable: true },
        { id: 'app-api-integration', title: 'API Integration', subtitle: 'Connecting to external services.', isDeletable: true },
        { id: 'app-testing', title: 'Testing', subtitle: 'Unit, integration, and user acceptance tests.', isDeletable: true },
        { id: 'app-bug-fixing', title: 'Bug Fixing', subtitle: 'Addressing issues found during testing.', isDeletable: true }
    ],
    "Interactive Fiction": [
        { id: 'interactive-opening-dialogue', title: 'Opening Dialogue', subtitle: 'Sets the initial scene and choices.', isDeletable: true },
        { id: 'interactive-user-choice-a', title: 'User Choice A', subtitle: 'First major decision point.', isDeletable: true },
        { id: 'interactive-branch-event', title: 'Branch Event', subtitle: 'Consequence of a user choice.', isDeletable: true },
        { id: 'interactive-twist', title: 'Twist', subtitle: 'Unexpected plot development.', isDeletable: true },
        { id: 'interactive-climax', title: 'Climax', subtitle: 'Peak of the story arc based on choices.', isDeletable: true },
        { id: 'interactive-outcome', title: 'Outcome', subtitle: 'One of the possible endings.', isDeletable: true }
    ],
    "Wellness Program": [
        { id: 'wellness-daily-reflection', title: 'Daily Reflection', subtitle: 'Guided thoughts for the day.', isDeletable: true },
        { id: 'wellness-breathing-exercise', title: 'Breathing Exercise', subtitle: 'Mindfulness and relaxation technique.', isDeletable: true },
        { id: 'wellness-journaling-prompt', title: 'Journaling Prompt', subtitle: 'Topic for written introspection.', isDeletable: true },
        { id: 'wellness-physical-stretch', title: 'Physical Stretch', subtitle: 'Recommended physical activity.', isDeletable: true },
        { id: 'wellness-gratitude-task', title: 'Gratitude Task', subtitle: 'Focusing on positive aspects.', isDeletable: true },
        { id: 'wellness-challenge-review', title: 'Challenge Review', subtitle: 'Reviewing progress on a specific goal.', isDeletable: true }
    ],
    "Personal Journal": [
        { id: 'journal-morning-thoughts', title: 'Morning Thoughts', subtitle: 'Initial reflections upon waking.', isDeletable: true },
        { id: 'journal-work-summary', title: 'Work Summary', subtitle: 'Recap of work-related activities.', isDeletable: true },
        { id: 'journal-mood-log', title: 'Mood Log', subtitle: 'Tracking emotional state.', isDeletable: true },
        { id: 'journal-highlight-of-day', title: 'Highlight of the Day', subtitle: 'The best moment or achievement.', isDeletable: true },
        { id: 'journal-evening-reflection', title: 'Evening Reflection', subtitle: 'Concluding thoughts before sleep.', isDeletable: true }
    ],
    "Marketing Campaign": [
        { id: 'marketing-teaser-post', title: 'Teaser Post', subtitle: 'Generate initial interest.', isDeletable: true },
        { id: 'marketing-launch-announcement', title: 'Launch Announcement', subtitle: 'Official campaign start.', isDeletable: true },
        { id: 'marketing-behind-the-scenes', title: 'Behind-the-Scenes', subtitle: 'Offer a glimpse into the process.', isDeletable: true },
        { id: 'marketing-influencer-feature', title: 'Influencer Feature', subtitle: 'Collaboration with an influencer.', isDeletable: true },
        { id: 'marketing-final-reminder', title: 'Final Reminder', subtitle: 'Last call to action.', isDeletable: true },
        { id: 'marketing-testimonial-share', title: 'Testimonial Share', subtitle: 'Social proof and user feedback.', isDeletable: true }
    ],
    "Game Narrative": [
        { id: 'game-intro-cutscene', title: 'Intro Cutscene', subtitle: 'Sets up the story and world.', isDeletable: true },
        { id: 'game-tutorial-objective', title: 'Tutorial Objective', subtitle: 'Teaches the player basic mechanics.', isDeletable: true },
        { id: 'game-combat-encounter', title: 'Combat Encounter', subtitle: 'A fight sequence.', isDeletable: true },
        { id: 'game-puzzle-challenge', title: 'Puzzle Challenge', subtitle: 'A brain-teaser for the player.', isDeletable: true },
        { id: 'game-boss-fight', title: 'Boss Fight', subtitle: 'A major confrontation with a powerful enemy.', isDeletable: true },
        { id: 'game-reward-sequence', title: 'Reward Sequence', subtitle: 'Player receives items or progression.', isDeletable: true }
    ],
    "Recipe Builder": [
        { id: 'recipe-gather-ingredients', title: 'Gather Ingredients', subtitle: 'List of all necessary items.', isDeletable: true },
        { id: 'recipe-prep-work', title: 'Prep Work', subtitle: 'Chopping, measuring, preheating.', isDeletable: true },
        { id: 'recipe-cook-base', title: 'Cook Base', subtitle: 'Initial cooking of main components.', isDeletable: true },
        { id: 'recipe-add-flavors', title: 'Add Flavors', subtitle: 'Incorporating spices and seasonings.', isDeletable: true },
        { id: 'recipe-simmer', title: 'Simmer/Cook', subtitle: 'Allowing flavors to meld.', isDeletable: true },
        { id: 'recipe-plate-dish', title: 'Plate Dish', subtitle: 'Arranging for presentation.', isDeletable: true },
        { id: 'recipe-serve', title: 'Serve', subtitle: 'Final serving instructions.', isDeletable: true }
    ],
    "Academic Paper": [
        { id: 'academic-abstract', title: 'Abstract', subtitle: 'Brief summary of the paper.', isDeletable: true },
        { id: 'academic-introduction', title: 'Introduction', subtitle: 'Background and research question.', isDeletable: true },
        { id: 'academic-methodology', title: 'Methodology', subtitle: 'How the research was conducted.', isDeletable: true },
        { id: 'academic-results', title: 'Results', subtitle: 'Findings of the research.', isDeletable: true },
        { id: 'academic-discussion', title: 'Discussion', subtitle: 'Interpretation of results.', isDeletable: true },
        { id: 'academic-conclusion', title: 'Conclusion', subtitle: 'Summary and future work.', isDeletable: true },
        { id: 'academic-references', title: 'References', subtitle: 'Cited works.', isDeletable: true }
    ],
    "Pitch Deck": [
        { id: 'pitch-problem', title: 'Problem', subtitle: 'The issue your product/service solves.', isDeletable: true },
        { id: 'pitch-solution', title: 'Solution', subtitle: 'How you address the problem.', isDeletable: true },
        { id: 'pitch-market-size', title: 'Market Size', subtitle: 'The potential market opportunity.', isDeletable: true },
        { id: 'pitch-product-demo', title: 'Product Demo', subtitle: 'Showcasing your product.', isDeletable: true },
        { id: 'pitch-business-model', title: 'Business Model', subtitle: 'How you make money.', isDeletable: true },
        { id: 'pitch-team', title: 'Team', subtitle: 'Introduce your core team.', isDeletable: true },
        { id: 'pitch-call-to-action', title: 'Call to Action', subtitle: 'What you want from the audience.', isDeletable: true }
    ],
    "Challenge Tracker": [
        { id: 'challenge-day-1-log', title: 'Day 1 Log', subtitle: 'Record activities and feelings for Day 1.', isDeletable: true },
        { id: 'challenge-day-2-task', title: 'Day 2 Task', subtitle: 'Specific objective for Day 2.', isDeletable: true },
        { id: 'challenge-day-3-reflection', title: 'Day 3 Reflection', subtitle: 'Thoughts on progress for Day 3.', isDeletable: true },
        { id: 'challenge-day-4-entry', title: 'Day 4 Entry', subtitle: 'General update for Day 4.', isDeletable: true },
        { id: 'challenge-day-5-goal', title: 'Day 5 Goal', subtitle: 'Target to achieve on Day 5.', isDeletable: true },
        { id: 'challenge-completion-log', title: 'Completion Log', subtitle: 'Final thoughts upon challenge completion.', isDeletable: true }
    ]
};

// The getDefaultSegments function has been moved to src/lib/segmentUtils.ts
// The mapTemplateToSegment helper has also been moved.
