
// src/components/dashboard/AIPlanGenerator.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, ChevronUp, ChevronDown, History, AlertTriangle, Sparkles, Dices } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { addEpisodeDb, getAllEpisodesForUserFromDb } from '@/lib/episodeStore';
import type { Episode, AIGeneratedEpisode, AIGenerationPlan } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAppContextMode } from '@/contexts/ModeContext';
import { switchWorkspaceAndProvisionPlan } from '@/lib/dataUtils';
import { Progress } from '@/components/ui/progress';
import { GeneratedPlanResponseSchema } from '@/types';
import type { z } from 'zod';
import { getRandomPromptForMode } from '@/lib/promptLibrary';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GoogleGenerativeAI } from '@google/generative-ai';

type GeneratedPlanResponse = z.infer<typeof GeneratedPlanResponseSchema>;

let genAI: GoogleGenerativeAI | null = null;

const getGenAIClient = (): GoogleGenerativeAI => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log("Gemini API Key (length):", apiKey?.length || 'undefined');
    console.log("Gemini API Key from env:", process.env.NEXT_PUBLIC_GEMINI_API_KEY);


    if (!apiKey || apiKey.includes('PASTE_YOUR')) {
      throw new Error("Gemini API key not found or is a placeholder. Please add it to your apphosting.yaml file and redeploy.");
    }
    // Initialize only once
    if (!genAI || genAI.apiKey !== apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

interface AIPlanGeneratorProps {
    user: User | null;
    onPlanAdded: () => void;
}

const parseJsonFromAiResponse = (text: string): any | null => {
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error("Failed to parse extracted JSON from AI response:", e);
        }
    }
    try {
        return JSON.parse(text);
    } catch(e) {
        console.error("Failed to parse entire AI response as JSON:", e);
    }
    return null;
};


export function AIPlanGenerator({ user, onPlanAdded }: AIPlanGeneratorProps) {
  const { toast } = useToast();
  const { currentMode, setMode: setAppContextMode, ALL_APP_MODES } = useAppContextMode();
  const [aiIdea, setAiIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  const [generatedPlanResponse, setGeneratedPlanResponse] = useState<GeneratedPlanResponse | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  
  const [generationPlan, setGenerationPlan] = useState<AIGenerationPlan | null>(null);
  const [accumulatedPlan, setAccumulatedPlan] = useState<AIGeneratedEpisode[]>([]);
  const [isGeneratingChecklists, setIsGeneratingChecklists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isApiKeyMissing = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    return !key || key.includes('PASTE_YOUR_GEMINI_API_KEY_HERE') || key.length < 10;
  }, []);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('aiPromptHistory');
      if (storedHistory) {
        setPromptHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load prompt history from localStorage", error);
    }
  }, []);
  
  const handleRandomizePrompt = () => {
    const randomPrompt = getRandomPromptForMode(currentMode.modeName);
    setAiIdea(randomPrompt);
  };
  
  const resetGenerationState = () => {
    setGenerationPlan(null);
    setAccumulatedPlan([]);
    setGeneratedPlanResponse(null);
    setGenerationProgress(0);
    setGenerationStatusText('');
    setIsGenerating(false);
    setIsGeneratingChecklists(false);
    setIsSubmitting(false);
  };
  
  const generateWithRetry = useCallback(async (
    prompt: string,
    attemptInfo: string
  ): Promise<any> => {
    const aiClient = getGenAIClient();
    const model = aiClient.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        generationConfig: {
          responseMimeType: "application/json",
        },
    });
    
    const maxRetries = 4;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonResponse = JSON.parse(responseText); // Direct parse because we requested JSON
        
        if (jsonResponse) {
            return jsonResponse;
        }
        throw new Error("AI returned data in an unexpected format.");

      } catch (error: any) {
        attempt++;
        const isRetryable = error.toString().includes('503') || error.toString().toLowerCase().includes('overloaded');
        
        if (isRetryable && attempt < maxRetries) {
          const delay = 1500 * Math.pow(2, attempt - 1);
          setGenerationStatusText(`AI is busy (${attemptInfo}). Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          let userFacingError = "An unknown error occurred during AI generation.";
          if (error.message && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
            userFacingError = "The provided API key is not valid. Please check your apphosting.yaml file and redeploy.";
          } else if (isRetryable) {
            userFacingError = "The AI service is currently overloaded and could not respond after several retries. Please try again in a few moments.";
          } else if (error.message) {
            userFacingError = error.message;
          }
          throw new Error(userFacingError);
        }
      }
    }
    throw new Error("AI generation failed after multiple retries.");
  }, [setGenerationStatusText]);

  const handleEnhancePrompt = async () => {
    if (!aiIdea.trim() || !user) return;

    let aiClient;
    try {
        aiClient = getGenAIClient();
    } catch (e: any) {
        toast({ title: "Configuration Error", description: e.message, variant: "destructive" });
        return;
    }

    const standardModel = aiClient.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    setIsEnhancing(true);
    try {
      const enhancePrompt = `You are a creative expert and prompt engineer for an application called PlotForm. A user has provided a basic idea. Your task is to rewrite and expand this idea into a more detailed and polished prompt that will produce the best possible structured plan from PlotForm's AI.

      **USER'S IDEA:**
      "${aiIdea}"

      **YOUR INSTRUCTIONS:**
      - **Incorporate Structure:** Explicitly mention things like number of episodes/chapters, a potential season name, or specific segment ideas.
      - **Add Detail:** Elaborate on the user's concept. Suggest a tone, a target audience, or a unique angle. If it's a story, suggest a simple character arc or a plot point.
      - **Keep it Concise:** The final prompt should be a single, well-structured paragraph.
      - **Maintain Core Idea:** Do not change the fundamental concept of the user's request. Enhance, don't replace.
      - **Respond only with the rewritten prompt text.** Do not add any conversational text or formatting.
      
      Example:
      User's Idea: "a podcast about space"
      Your Response: "Create a 6-episode podcast season named 'Cosmic Curiosities' aimed at young adults. The tone should be educational but exciting. Cover topics like black holes in episode 1, the possibility of alien life in episode 2, a deep dive on Mars rovers, the interstellar missions, the life cycle of a star, and end with a Q&A episode."`;

      const result = await standardModel.generateContent(enhancePrompt);
      const enhancedText = result.response.text();
      setAiIdea(enhancedText.trim());
      toast({
        title: "Idea Enhanced!",
        description: "Your prompt has been polished. You can now generate the plan.",
      });
      
    } catch (error: any) {
      toast({
        title: "Enhancement Failed",
        description: error.message || "The AI could not enhance the prompt at this time.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const startInitialPlanning = () => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in or sign up to use the AI features.", variant: 'destructive' });
        return;
    }
    if (!aiIdea.trim()) {
        toast({ title: "Idea Required", description: "Please enter an idea to generate a plan.", variant: 'destructive' });
        return;
    }
    
    setIsGenerating(true);
    setGenerationStatusText("Initializing generation...");
    setGenerationProgress(2);
    
    setTimeout(async () => {
        resetGenerationState();
        setIsGenerating(true);
        setGenerationStatusText("Asking AI to create a high-level plan...");
        setGenerationProgress(5);

        const newHistory = [aiIdea.trim(), ...promptHistory.filter(p => p !== aiIdea.trim())].slice(0, 4);
        setPromptHistory(newHistory);
        try {
            localStorage.setItem('aiPromptHistory', JSON.stringify(newHistory));
        } catch (error) { console.error("Failed to save prompt history", error); }

        try {
            const availableModes = ALL_APP_MODES.map(m => m.modeName).join(', ');
            const planningPrompt = `Analyze the user's request and create a high-level generation plan.
            
            **USER REQUEST:** "${aiIdea}"
            
            **YOUR TASK & RULES:** Respond with a single JSON object that follows this exact structure:
            {
              "isMultiPart": boolean,
              "totalParts": number | undefined,
              "partDescriptions": string[] | undefined,
              "suggestedMode": string,
              "seasonName": string | null,
              "seasonNumber": number | null
            }
            1.  **Analyze Request for Quantity:** Read the user's request to identify the number of items they want (e.g., "12 tracks", "a 7-episode series").
            2.  **Determine "isMultiPart":** If the user requests more than 5 items, or the request is complex, set "isMultiPart" to true. Otherwise, set it to false.
            3.  **Create "partDescriptions" (if multi-part):** If "isMultiPart" is true, create a "partDescriptions" array. Divide the total request logically into parts. Each string should describe one part (e.g., "Tracks 1-4: The Introduction"). The "totalParts" field must equal the length of this array.
            4.  **Suggest "suggestedMode":** Suggest the single best mode from the available list.
            5.  **Suggest Naming:** Suggest a creative "seasonName" (or null) and a "seasonNumber" (usually 1, or null).
            
            **AVAILABLE MODES**: ${availableModes}
            Do NOT generate the actual content yet, only the plan JSON.`;

            const planResponseData = await generateWithRetry(planningPrompt, "planning");

            if (!planResponseData) throw new Error("AI failed to return a valid generation plan.");
            if (planResponseData.isMultiPart && (!Array.isArray(planResponseData.partDescriptions) || planResponseData.partDescriptions.length === 0)) {
                throw new Error("AI planned a multi-part generation but failed to provide part descriptions.");
            }
            
            setGenerationPlan(planResponseData);
        } catch (error: any) {
            toast({ title: "AI Planning Failed", description: error.message || "An unknown error occurred.", variant: "destructive", duration: 9000 });
            resetGenerationState();
        }
    }, 0);
  };

  const executeContentGenerationLoop = useCallback(async () => {
    if (!generationPlan || !user) return;

    const totalParts = generationPlan.totalParts || 1;
    let tempAccumulatedPlan: AIGeneratedEpisode[] = [];

    const modeForGeneration = ALL_APP_MODES.find(m => m.modeName === generationPlan.suggestedMode) || currentMode;

    for (let i = 1; i <= totalParts; i++) {
        const progress = 10 + (80 * (i / totalParts));
        setGenerationProgress(progress);
        setGenerationStatusText(`Generating content for part ${i} of ${totalParts}: ${generationPlan.partDescriptions?.[i - 1] || '...'}`);

        try {
            const partDescription = generationPlan.isMultiPart ? `This is part ${i} of ${totalParts}. The topic for this part is: "${generationPlan.partDescriptions?.[i - 1]}".` : "This is a single-part generation.";
            const context = tempAccumulatedPlan.length > 0 ? `For context, here are the parts you have already generated:\n${JSON.stringify(tempAccumulatedPlan, null, 2)}` : "";
            
            const contentPrompt = `You are an expert-level creative partner and master storyteller for a project in the "${modeForGeneration.modeName}" category. Your task is to generate a comprehensive, publication-ready plan.
            
            **USER'S ORIGINAL REQUEST:** "${aiIdea}"
            
            **YOUR GENERATION PLAN:**
            - **Current Task:** ${partDescription}
            - **Previously Generated Context:** ${context}
            
            **CRITICAL INSTRUCTIONS & QUALITY STANDARDS:**
            1.  **Generate In-Depth Content:** Your primary goal is to generate the ACTUAL, DETAILED, LONG-FORM content for every single segment. Do not use placeholders like "[Insert details here]". Write the script, the prose, the talking points, or the narrative as if it were a final draft. Be creative, thorough, and produce a high-quality, complete plan.
            2.  **No Laziness:** Do not write short, generic, or repetitive notes. Each segment's content must be unique, rich, and directly relevant to its title and the overall project goal. Each part should feel like a finished piece of work.
            3.  **Maintain Consistency:** Ensure the content for this part logically and narratively follows the "Previously Generated Context". The entire plan must feel cohesive.
            4.  **Strict JSON Response:** Respond ONLY with a single, valid JSON object with a key "episodes". The value must be an array of objects, each with fields: "seasonName" (string | null), "seasonNumber" (number | null), "episodeNumber" (number | null), "episodeTitle" (string), "episodeNotes" (string), and "segments" (an array of objects, each with "title" and "content"). Ensure all strings are properly escaped.
            
            **EXAMPLE STRUCTURE:**
            {
              "episodes": [
                {
                  "seasonName": "Example Season Name",
                  "seasonNumber": 1,
                  "episodeNumber": 1,
                  "episodeTitle": "The First Step",
                  "episodeNotes": "A detailed summary of what this first episode covers and its narrative purpose.",
                  "segments": [
                    { "title": "Introduction to the World", "content": "Detailed, long-form introductory script or prose that sets the scene, introduces characters, and establishes the core conflict or topic..." },
                    { "title": "The Inciting Incident", "content": "A full, in-depth description of the key event that kicks off the story or main discussion. This should be several paragraphs long..." }
                  ]
                }
              ]
            }`;
            
            const newContentData = await generateWithRetry(contentPrompt, `part ${i}/${totalParts}`);
            if (!newContentData || !Array.isArray(newContentData.episodes)) throw new Error(`AI returned invalid episode data for part ${i}.`);
            
            const episodesWithContext = newContentData.episodes.map((ep: any) => ({
                ...ep,
                seasonName: ep.seasonName ?? generationPlan.seasonName ?? null,
                seasonNumber: ep.seasonNumber ?? generationPlan.seasonNumber ?? 1,
            }));

            tempAccumulatedPlan = [...tempAccumulatedPlan, ...episodesWithContext];
        } catch (error: any) {
            throw new Error(`AI Plan Generation Failed (Part ${i}): ${error.message}`);
        }
    }
    setAccumulatedPlan(tempAccumulatedPlan);
    setIsGeneratingChecklists(true); 
  }, [generationPlan, user, aiIdea, generateWithRetry, currentMode, ALL_APP_MODES]);

  useEffect(() => {
    if (generationPlan && accumulatedPlan.length === 0 && !isGeneratingChecklists) {
      (async () => {
        try {
          await executeContentGenerationLoop();
        } catch (error: any) {
          toast({ title: "AI Generation Failed", description: error.message, variant: "destructive", duration: 9000 });
          resetGenerationState();
        }
      })();
    }
  }, [generationPlan, accumulatedPlan, isGeneratingChecklists, executeContentGenerationLoop, toast]);
  
  const executeChecklistGeneration = useCallback(async () => {
    if (!accumulatedPlan.length || !user) return;

    setGenerationStatusText("Generating production checklists...");
    setGenerationProgress(95);

    let planWithChecklists: AIGeneratedEpisode[] = [];
    for (const episode of accumulatedPlan) {
      try {
        const checklistPrompt = `Given the following episode plan, create a custom production checklist of 3-5 tasks that are **highly specific and directly related to its content**.
        CRITICAL INSTRUCTION: Do NOT use generic tasks like "edit audio" or "upload episode". Create tasks that reference the actual titles and topics of the segments.
        EPISODE PLAN:
        Title: ${episode.episodeTitle}
        Segments:
        ${episode.segments.map((s: any) => `- ${s.title}: ${s.content ? s.content.substring(0, 100) : ''}...`).join('\n')}
        CRITICAL RESPONSE FORMAT: Respond ONLY with a valid JSON object with a single key "checklist", which is an array of strings.
        {
          "checklist": [
            "Specific task 1 related to segment content...",
            "Specific task 2 related to segment content..."
          ]
        }`;
        
        const checklistData = await generateWithRetry(checklistPrompt, `checklist for "${episode.episodeTitle?.substring(0, 15)}..."`);
        const checklist = checklistData?.checklist || [];
        planWithChecklists.push({ ...episode, productionChecklist: checklist });
      } catch (error) {
        console.error(`Checklist generation failed for "${episode.episodeTitle}", adding with no checklist.`);
        planWithChecklists.push({ ...episode, productionChecklist: [] });
      }
    }
    
    setGenerationProgress(100);
    setGenerationStatusText("Plan complete!");
    setIsGenerating(false);

    const finalPlan = planWithChecklists.map(ep => ({
        ...ep,
        seasonName: ep.seasonName === undefined ? null : ep.seasonName,
        prompt: aiIdea.trim(),
    }));
    
    const validatedResponse = GeneratedPlanResponseSchema.safeParse({
        plan: finalPlan,
        suggestedMode: generationPlan?.suggestedMode || currentMode.modeName
    });

    if (!validatedResponse.success) {
        console.error("Final plan validation failed:", validatedResponse.error);
        toast({ title: "AI Plan Validation Failed", description: "The final generated plan did not match the expected format.", variant: "destructive" });
        resetGenerationState();
        return;
    }

    setGeneratedPlanResponse(validatedResponse.data);

    if (validatedResponse.data.suggestedMode === currentMode.modeName) {
        handleConfirmAddPlanToCurrentWorkspace(validatedResponse.data.plan);
    } else {
        setShowPlanDialog(true);
    }

  }, [accumulatedPlan, user, generationPlan, currentMode.modeName, generateWithRetry, aiIdea, toast]);

  useEffect(() => {
    if (isGeneratingChecklists) {
        executeChecklistGeneration();
    }
  }, [isGeneratingChecklists, executeChecklistGeneration]);


  const handleConfirmAddPlanToCurrentWorkspace = async (plan: AIGeneratedEpisode[]) => {
    if (!plan || !user?.uid) return;
    setIsSubmitting(true);
    setGenerationStatusText(`Adding ${plan.length} item(s) to your workspace...`);

    try {
        const modeForSaving = ALL_APP_MODES.find(m => m.modeName === (generatedPlanResponse?.suggestedMode)) || currentMode;

        const existingEpisodes = await getAllEpisodesForUserFromDb(user.uid);
        
        const existingEpisodesInSeason = existingEpisodes.filter(e => e.seasonNumber === (plan[0]?.seasonNumber ?? 1));
        let nextEpisodeNumber = 1;
        if (existingEpisodesInSeason.length > 0) {
            nextEpisodeNumber = Math.max(...existingEpisodesInSeason.map(e => e.episodeNumber ?? 0)) + 1;
        }


        for (let i = 0; i < plan.length; i++) {
            const planItem = plan[i];
            const title = planItem.episodeTitle || `Untitled Item ${i + 1}`; 
            
            const newEpisodeData: Omit<Episode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'collaborators' | 'ownerHostDisplayName' | 'importedHostDisplayName'> = {
                title: title,
                seasonName: planItem.seasonName,
                seasonNumber: planItem.seasonNumber,
                episodeNumber: planItem.episodeNumber ?? (nextEpisodeNumber + i),
                episodeNotes: planItem.episodeNotes || '',
                segments: (planItem.segments || []).map((seg: any) => ({
                    id: uuidv4(),
                    title: seg.title || 'Untitled Segment',
                    subtitle: seg.productionNotes || '',
                    host1Notes: seg.content || '',
                    host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
                    host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
                })),
                productionChecklist: (planItem.productionChecklist || []).map(taskText => ({ id: uuidv4(), text: taskText, completed: false, linkedSegmentId: null })),
                isMock: false,
                isAiGenerated: true,
                promptUsed: aiIdea.trim(),
                linkedAppMode: modeForSaving.modeName,
            };
            await addEpisodeDb(newEpisodeData, user.uid, modeForSaving);
        }
        
        toast({ title: "Plan Added!", description: `Successfully added ${plan.length} new item(s) to your dashboard.` });
        
        setTimeout(() => {
          toast({
            title: "Pro Tip!",
            description: "You can polish these results even further. Open any new item in the full editor to use the 'AI Content Polish' feature.",
            duration: 7000,
          });
        }, 1000);
        onPlanAdded();

    } catch (error: any) {
        console.error("Error adding generated plan to DB:", error);
        toast({ title: "Error Adding Plan", description: error.message || "Could not add the generated plan.", variant: "destructive" });
    } finally {
        resetGenerationState();
        setShowPlanDialog(false);
    }
  };

  const handleSwitchWorkspaceAndAdd = async () => {
    if (!generatedPlanResponse || !user?.uid) return;
    setShowPlanDialog(false);
    await setAppContextMode(generatedPlanResponse.suggestedMode);
    await handleConfirmAddPlanToCurrentWorkspace(generatedPlanResponse.plan);
  };

  return (
    <>
      <Dialog open={showPlanDialog} onOpenChange={(open) => { if (!open) { resetGenerationState(); } setShowPlanDialog(open); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>AI Suggestion & Plan Review</DialogTitle>
                  <DialogDescription>
                      The AI has generated a plan with {generatedPlanResponse?.plan.length || 0} item(s) and suggests a new workspace setup.
                  </DialogDescription>
              </DialogHeader>
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Workspace Change Recommended</AlertTitle>
                  <AlertDescription>
                      The AI suggests changing your default workspace mode from **"{currentMode.modeName}"** to **"{generatedPlanResponse?.suggestedMode}"** to better fit this plan. Your existing items will not be affected.
                  </AlertDescription>
              </Alert>

              <DialogFooter className="pt-4 sm:justify-between gap-2">
                  <Button variant="outline" onClick={() => handleConfirmAddPlanToCurrentWorkspace(generatedPlanResponse!.plan)} disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add to Current Workspace
                  </Button>
                  <Button onClick={handleSwitchWorkspaceAndAdd} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Switch Default Mode & Add
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg bg-muted/30">
        <TooltipProvider>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                  <CardTitle className="flex items-center text-primary"><Wand2 className="mr-2 h-5 w-5"/>AI Plan Generator</CardTitle>
                  {!isMinimized && (
                      <CardDescription className="mt-1.5">
                        Have an idea? Describe it below and let AI create a structured plan for you, complete with titles, segments, and production tasks.
                        <span className="block mt-2 text-xs text-muted-foreground/80">
                            Note: Longer, more complex requests are automatically broken into parts to ensure quality, which may take a few moments to complete.
                        </span>
                      </CardDescription>
                  )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 text-muted-foreground shrink-0" aria-label={isMinimized ? "Expand AI Plan Generator" : "Collapse AI Plan Generator"}>
                  {isMinimized ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {!isMinimized && (
            <>
              <CardContent>
                {!user ? (
                  <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg bg-background/50">
                    <p>Please <Link href="/login" className="text-primary hover:underline font-semibold">log in</Link> or <Link href="/signup" className="text-primary hover:underline font-semibold">sign up</Link> to use the AI Plan Generator.</p>
                  </div>
                ) : (
                  <div>
                    {isGenerating || isSubmitting ? (
                        <div className="space-y-2">
                            <Progress value={generationProgress} />
                            <p className="text-sm text-muted-foreground text-center">
                                {generationStatusText}
                            </p>
                        </div>
                    ) : (
                        <Textarea
                            value={aiIdea}
                            onChange={(e) => setAiIdea(e.target.value)}
                            placeholder="e.g., A 5-episode podcast series about the history of video game consoles, a 12-chapter fantasy novel about a dragon with a named season 'The Ruby Scales', a marketing campaign for a new soda brand..."
                            rows={4}
                            className="bg-background"
                            disabled={isGenerating || !user || isEnhancing}
                        />
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button onClick={startInitialPlanning} disabled={isGenerating || isSubmitting || isEnhancing || !aiIdea.trim() || !user}>
                       {isGenerating || isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Generating...
                          </>
                        ) : (
                            'Generate Plan'
                        )}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={isGenerating || isSubmitting || isEnhancing || promptHistory.length === 0}>
                            <History className="mr-2 h-4 w-4" /> History
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Recent Ideas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {promptHistory.map((prompt, index) => (
                            <DropdownMenuItem key={index} onSelect={() => setAiIdea(prompt)} className="cursor-pointer">
                            <p className="max-w-xs truncate">{prompt}</p>
                            </DropdownMenuItem>
                        ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                 <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" onClick={handleRandomizePrompt} disabled={isGenerating || isSubmitting || isEnhancing || !user}>
                            <Dices className="mr-2 h-4 w-4 text-primary" />
                            Randomize Idea
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate a random, high-quality prompt for the current mode.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" onClick={handleEnhancePrompt} disabled={isGenerating || isSubmitting || isEnhancing || !aiIdea.trim() || !user}>
                            {isEnhancing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4 text-accent" />
                            )}
                            Enhance Idea
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Let the AI rewrite your current idea into a more detailed prompt.</p>
                      </TooltipContent>
                    </Tooltip>
                </div>
              </CardFooter>
            </>
          )}
        </TooltipProvider>
      </Card>
    </>
  );
}
