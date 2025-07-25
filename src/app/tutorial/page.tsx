
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Wand2, ArrowRight, ListTree, Users, LayoutGrid, Calendar, Settings } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { db as clientDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { provisionMockEpisodes } from '@/lib/mockData';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { setShowPlannerName, resetUserPreferencesDb } from '@/lib/episodeLayoutsStore';
import { useAppContextMode } from '@/contexts/ModeContext';
import { useRouter } from 'next/navigation';
import { ALL_APP_MODES, DEFAULT_APP_MODE_NAME } from '@/lib/modes';
import { getModeIcon } from '@/lib/modeIcons';
import Link from 'next/link';
import { pluralize } from '@/lib/dataUtils';

export default function TutorialPage() {
  const { user, loading: authLoading } = useAuth();
  const { settings: userSettings, updateSettings: updateUserSettings, loadingSettings } = useUserSettings();
  const { setMode: setAppContextMode, isLoadingMode } = useAppContextMode();
  const { toast } = useToast();
  const router = useRouter();

  const [pageState, setPageState] = useState<'setup' | 'guide'>('setup');
  const [setupStep, setSetupStep] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModeName, setSelectedModeName] = useState(DEFAULT_APP_MODE_NAME);
  const [provisionMockData, setProvisionMockData] = useState<"yes" | "no">("yes");
  const [plannerName, setPlannerName] = useState('');
  
  const pageIsLoading = authLoading || loadingSettings || isLoadingMode;

  const handleFinishSetup = async () => {
    if (!user || !user.uid || !clientDb || !plannerName.trim() || !selectedModeName) {
      toast({ title: "Error", description: "Cannot complete setup. User not logged in or planner name is empty.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const finalSelectedMode = ALL_APP_MODES.find(m => m.modeName === selectedModeName) || ALL_APP_MODES[0];

      await setShowPlannerName(user.uid, plannerName.trim());
      await resetUserPreferencesDb(user.uid, finalSelectedMode);
      
      if (provisionMockData === 'yes') {
        await provisionMockEpisodes(user.uid, clientDb, finalSelectedMode);
      }
      
      await updateUserSettings({ 
        selectedAppModeName: finalSelectedMode.modeName,
        hasProvisionedInitialContent: provisionMockData === 'yes', 
        tutorialViewedAt: Timestamp.now().toMillis(),
        guidedTourDashboardCompleted: false, 
        guidedTourSettingsCompleted: false,
      });

      toast({ title: "Setup Complete!", description: `Welcome to ${APP_NAME}! Here's a quick guide to get you started.` });
      
      setPageState('guide');
      
    } catch (e: any) {
      console.error("Failed to complete setup:", e);
      toast({ title: "Setup Error", description: e.message || "An unknown error occurred during setup.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (pageIsLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading setup...</p>
      </div>
    );
  }

  const renderSetupWizard = () => {
    const selectedModeForDisplay = ALL_APP_MODES.find(m => m.modeName === selectedModeName) || ALL_APP_MODES[0];

    switch(setupStep) {
      case 0:
        return (
          <Card className="flex flex-col h-full w-full">
            <CardHeader>
              <CardTitle>Choose Your Workspace</CardTitle>
              <CardDescription>Select the type of project you're working on. This will tailor the app's language and defaults for you.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <RadioGroup value={selectedModeName} onValueChange={setSelectedModeName}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_APP_MODES.map(mode => {
                      const Icon = getModeIcon(mode.modeName);
                      return (
                        <Label key={mode.modeName} htmlFor={mode.modeName} className="block cursor-pointer">
                          <Card className={`p-4 hover:bg-accent hover:text-accent-foreground transition-all duration-200 ${selectedModeName === mode.modeName ? 'ring-2 ring-primary bg-accent text-accent-foreground' : 'bg-card'}`}>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={mode.modeName} id={mode.modeName} className="sr-only" />
                              {Icon ? <Icon className="h-6 w-6 text-primary" /> : <div className="h-6 w-6"></div>}
                              <span className="font-semibold">{mode.modeName}</span>
                            </div>
                          </Card>
                        </Label>
                      )
                  })}
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setSetupStep(1)} className="w-full sm:w-auto">Next</Button>
            </CardFooter>
          </Card>
        );
      case 1:
        return (
          <Card>
            <CardHeader><CardTitle>Add Sample Data?</CardTitle><CardDescription>Would you like us to add some sample {pluralize(selectedModeForDisplay.episodeLabel).toLowerCase()} to help you get started?</CardDescription></CardHeader>
            <CardContent>
              <RadioGroup value={provisionMockData} onValueChange={(value: "yes" | "no") => setProvisionMockData(value)} className="space-y-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="mock-yes"/>
                    <Label htmlFor="mock-yes">Yes, add some samples. <span className="text-muted-foreground font-normal">(Recommended)</span></Label>
                </div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="mock-no"/><Label htmlFor="mock-no">No, I'll start with a blank slate.</Label></div>
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => setSetupStep(0)} variant="outline">Back</Button>
              <Button onClick={() => setSetupStep(2)}>Next</Button>
            </CardFooter>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader><CardTitle>Name Your Planner</CardTitle><CardDescription>Give your {selectedModeForDisplay.modeName} workspace a name. You can change this later in Settings.</CardDescription></CardHeader>
            <CardContent>
              <Input id="plannerName" value={plannerName} onChange={(e) => setPlannerName(e.target.value)} placeholder={`E.g., My ${selectedModeForDisplay.modeName} Projects`} className="bg-background" autoFocus />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => setSetupStep(1)} variant="outline">Back</Button>
              <Button onClick={handleFinishSetup} disabled={isProcessing || !plannerName.trim()} className="w-full sm:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Finish Setup
              </Button>
            </CardFooter>
          </Card>
        );
      default:
        return null;
    }
  }

  const renderGuide = () => (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="text-2xl">How to Use {APP_NAME}</CardTitle>
        <CardDescription>Here’s a quick guide to the core features to get you started.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div>
            <h3 className="font-semibold text-primary flex items-center mb-1"><Wand2 className="h-4 w-4 mr-2"/>AI-Powered Planning</h3>
            <p>The best place to start is the <span className="font-semibold">AI Plan Generator</span> on your <Link href="/dashboard" className="text-accent hover:underline">Dashboard</Link>. Give it a simple idea (e.g., "a 5-part podcast on ancient Rome") and it will generate a complete, structured plan with multiple episodes and segments. For existing projects, open the full editor and use the <span className="font-semibold">AI Content Polish</span> tool to refine and expand upon your notes.</p>
        </div>
        <div>
            <h3 className="font-semibold text-primary flex items-center mb-1"><LayoutGrid className="h-4 w-4 mr-2"/>Dashboard Views</h3>
            <p>Your main hub shows all your projects. Switch between the detailed <span className="font-semibold">List View</span> for inline editing, the automated <span className="font-semibold">Board View</span> that tracks your workflow, and the <span className="font-semibold">Timeline View</span> for a Gantt chart of your schedule. You can access these views from the top of your <Link href="/dashboard" className="text-accent hover:underline">Dashboard</Link>.</p>
        </div>
        <div>
            <h3 className="font-semibold text-primary flex items-center mb-1"><Users className="h-4 w-4 mr-2"/>Collaboration & Teams</h3>
            <p>Create <span className="font-semibold">Teams</span> to share projects with collaborators in a central workspace. For simpler sharing, use the "Share via Link" option on any item to send a copy to a collaborator, which they will receive in their <span className="font-semibold">Inbox</span> (accessible from the top navigation bar).</p>
        </div>
        <div>
            <h3 className="font-semibold text-primary flex items-center mb-1"><Calendar className="h-4 w-4 mr-2"/>Production Calendar</h3>
            <p>The <Link href="/calendar" className="text-accent hover:underline">Calendar</Link> provides a high-level overview of your production schedule. You can add custom tasks and deadlines directly to it, and export your entire schedule to your favorite calendar app (Google Cal, Apple Cal, etc.).</p>
        </div>
        <div>
            <h3 className="font-semibold text-primary flex items-center mb-1"><Settings className="h-4 w-4 mr-2"/>Customization & Data Management</h3>
            <p>Head to <Link href="/settings" className="text-accent hover:underline">Settings</Link> to change your workspace theme, set a preferred username, and manage custom layouts. You can also use the powerful <span className="font-semibold">"Save Current State"</span> feature to create named backups of your entire workspace, or use the export/import tools to manage your data files.</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => router.push('/dashboard?startTour=true')} className="w-full sm:w-auto">
          Start Interactive Tour <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
        <div className="w-full max-w-3xl">
          {pageState === 'setup' && (
            <>
              <Card className="mb-8 shadow-lg text-center">
                  <CardHeader>
                  <Wand2 className="mx-auto h-12 w-12 text-primary mb-3" />
                  <CardTitle className="text-3xl font-bold">Welcome to {APP_NAME}!</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                      Let's customize your workspace.
                  </CardDescription>
                  </CardHeader>
              </Card>
              {renderSetupWizard()}
            </>
          )}
          {pageState === 'guide' && renderGuide()}
        </div>
    </div>
  );
}
