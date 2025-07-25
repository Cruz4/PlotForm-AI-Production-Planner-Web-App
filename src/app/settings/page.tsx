
'use client';

import { useState, useEffect, useCallback, type KeyboardEvent, type ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, AlertTriangle, Palette, UserCog, Save, RefreshCcw, ListTree, SettingsIcon, Clapperboard, Paintbrush, Check, X, Wand2, Sparkles, DownloadCloud, UploadCloud, FolderPlus, FolderOpen, FolderSymlink, Lightbulb, Copy, Edit3, HelpCircle } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomTheme } from '@/contexts/CustomThemeContext';
import { 
  setCustomHost1Name, 
  getCustomHost1Name, 
  deleteAllLayoutsForUserDb, 
  resetUserPreferencesDb,
  setShowPlannerName,
  getShowPlannerName
} from '@/lib/episodeLayoutsStore';
import { deleteAllEpisodesForUserDb, addEpisodeDb } from '@/lib/episodeStore';
import { provisionMockEpisodes } from '@/lib/mockData';
import { db as clientDb } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { DEFAULT_THEME_NAME, ALL_THEMES as PREDEFINED_ALL_THEMES, createAppThemeFromCustomColors } from '@/lib/themes';
import { APP_NAME } from '@/lib/constants';
import { Switch } from '@/components/ui/switch';
import type { UserCustomTheme, AppTheme, UserWorkspace, TourStepDefinition, AllAppData, Episode } from '@/types';
import { saveUserCustomTheme, getUserCustomThemes, deleteUserCustomTheme, updateUserCustomTheme, deleteAllUserCustomThemesForUser } from '@/lib/userCustomThemesStore';
import { exportCurrentUserData, importCurrentUserData, parseFileToEpisodeList } from '@/lib/dataUtils'; 
import { saveUserWorkspace, getUserWorkspaces, deleteUserWorkspace, applyUserWorkspace, deleteAllUserWorkspacesForUser } from '@/lib/userWorkspacesStore'; 
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useAppContextMode } from '@/contexts/ModeContext';
import { ALL_APP_MODES, getDefaultAppMode } from '@/lib/modes';
import GuidedTour from '@/components/tour/GuidedTour';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const settingsTourSteps: TourStepDefinition[] = [
    {
      selector: '[data-tour-id="settings-workspace-config"]',
      title: 'Workspace & Username',
      content: 'Customize the name of your overall planner and set your preferred username, which is used in exports and collaboration.',
      placement: 'bottom',
      verticalOffset: -32,
    },
    {
      selector: '[data-tour-id="settings-appearance"]',
      title: 'Appearance',
      content: 'Personalize your workspace by choosing a color theme. You can even create your own custom themes further down the page!',
      placement: 'bottom',
      verticalOffset: -32,
    },
    {
      selector: '[data-tour-id="settings-manage-states"]',
      title: 'Manage Project States',
      content: 'This powerful feature lets you save a complete snapshot of your entire workspace. It\'s perfect for backups or managing multiple large, distinct projects.',
      placement: 'top',
      verticalOffset: -32,
    },
    {
      selector: '[data-tour-id="settings-data-file"]',
      title: 'Export & Import Files',
      content: 'Use these tools to export your entire workspace to a single file for backup, or to import data from a file. You can also add new plans from structured Markdown or JSON files.',
      placement: 'top',
      verticalOffset: -32,
    },
    {
      selector: '[data-tour-id="settings-app-mode"]',
      title: 'Default Application Mode',
      content: 'Set the default mode for any new seasons you create. You can override this for each season on the dashboard.',
      placement: 'top',
      verticalOffset: -32,
    },
    {
      selector: '[data-tour-id="settings-danger-zone"]',
      title: 'Danger Zone',
      content: 'Be careful here! You can reset all your application data to start fresh, or permanently delete your account.',
      placement: 'top',
      verticalOffset: -32,
    },
];

const isValidHexColor = (hex: string): boolean => /^#[0-9A-F]{6}$/i.test(hex) || /^#[0-9A-F]{3}$/i.test(hex);

export default function SettingsPage() {
  const { user, deleteUserAccountAndData, loading: authLoading } = useAuth();
  const { settings, updateSettings, refreshUserSettings, loadingSettings } = useUserSettings();
  const { toast } = useToast();
  const router = useRouter();
  const { currentMode, setMode: setAppContextMode, ALL_APP_MODES, getDefaultAppMode } = useAppContextMode();
  
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (!loadingSettings && settings && !settings.guidedTourSettingsCompleted) {
        // Use a session flag to prevent re-triggering on hot-reload during development
        const tourAutoStarted = sessionStorage.getItem('settingsTourAutoStarted');
        if (!tourAutoStarted) {
            const timer = setTimeout(() => {
                setIsTourOpen(true);
                sessionStorage.setItem('settingsTourAutoStarted', 'true');
            }, 500); // Small delay to ensure page is settled
            return () => clearTimeout(timer);
        }
    }
  }, [settings, loadingSettings]);

  const handleTourClose = () => {
    setIsTourOpen(false);
    if (settings && !settings.guidedTourSettingsCompleted) {
      updateSettings({ guidedTourSettingsCompleted: true });
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedModeForReset, setSelectedModeForReset] = useState(currentMode.modeName);
  const [confirmResetText, setConfirmResetText] = useState('');

  const { currentThemeName, currentThemeClassName, setCurrentTheme, availableThemes, refreshCustomThemes, loadingCustomThemes: isLoadingContextThemes } = useCustomTheme();

  const [customHost1NameInput, setCustomHost1NameInput] = useState('');
  const [isLoadingHostName, setIsLoadingHostName] = useState(true);

  const [plannerNameInput, setPlannerNameInput] = useState('');
  const [isLoadingPlannerName, setIsLoadingPlannerName] = useState(true);

  const [customThemeName, setCustomThemeName] = useState('');
  const [customPrimaryHex, setCustomPrimaryHex] = useState('#A78BFA');
  const [customSecondaryHex, setCustomSecondaryHex] = useState('#7DD3FC');
  const [customAccentHex, setCustomAccentHex] = useState('#FACD3D');
  const [isSavingCustomTheme, setIsSavingCustomTheme] = useState(false);
  const [userThemesList, setUserThemesList] = useState<UserCustomTheme[]>([]);
  const [isLoadingUserThemesList, setIsLoadingUserThemesList] = useState(true);
  
  // State for editing an existing theme
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingThemeName, setEditingThemeName] = useState('');
  const [editingPrimaryHex, setEditingPrimaryHex] = useState('');
  const [editingSecondaryHex, setEditingSecondaryHex] = useState('');
  const [editingAccentHex, setEditingAccentHex] = useState('');
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  const [isExportingData, setIsExportingData] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);
  const [jsonFileToImport, setJsonFileToImport] = useState<File | null>(null);

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [savedWorkspaces, setSavedWorkspaces] = useState<UserWorkspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspaceToLoad, setWorkspaceToLoad] = useState<UserWorkspace | null>(null);
  const [showLoadWorkspaceConfirmDialog, setShowLoadWorkspaceConfirmDialog] = useState(false);
  const [isApplyingWorkspace, setIsApplyingWorkspace] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<UserWorkspace | null>(null);
  const [showDeleteWorkspaceConfirmDialog, setShowDeleteWorkspaceConfirmDialog] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  
  const [showAppModeConfirmDialog, setShowAppModeConfirmDialog] = useState(false);
  const [pendingModeName, setPendingModeName] = useState('');
  const [isImportingPlanData, setIsImportingPlanData] = useState(false);
  const importPlanDataInputRef = useRef<HTMLInputElement>(null);

  const handleImportPlanDataFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.uid) {
      setIsImportingPlanData(true);
      const reader = new FileReader();
      const currentUserId = user.uid;
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const { episodes: importedEpisodes, plannerName: importedPlannerName } = parseFileToEpisodeList(content);
  
          if (importedEpisodes.length === 0) {
            throw new Error("Could not find any valid items to import in the file.");
          }
          
          if (importedPlannerName) {
            await setShowPlannerName(currentUserId, importedPlannerName);
            setPlannerNameInput(importedPlannerName);
          }

          for (const partialEpisode of importedEpisodes) {
              const episodeToAdd: Omit<Episode, "id" | "createdAt" | "updatedAt" | "createdBy" | "collaborators" | "ownerHostDisplayName" | "importedHostDisplayName"> = {
                  title: partialEpisode.title || 'Untitled Imported Item',
                  episodeNumber: partialEpisode.episodeNumber ?? null,
                  seasonNumber: partialEpisode.seasonNumber ?? null,
                  seasonName: partialEpisode.seasonName ?? null,
                  episodeNotes: partialEpisode.episodeNotes || '',
                  segments: partialEpisode.segments || [],
                  productionChecklist: partialEpisode.productionChecklist || [],
                  isArchived: partialEpisode.isArchived || false,
                  dateScheduledForRecording: partialEpisode.dateScheduledForRecording || null,
                  dateRecorded: partialEpisode.dateRecorded || null,
                  dateUploaded: partialEpisode.dateUploaded || null,
                  specialGuest: partialEpisode.specialGuest || null,
                  lunchProvidedBy: partialEpisode.lunchProvidedBy || null,
                  isFavorite: partialEpisode.isFavorite || false,
                  status: partialEpisode.status || 'planning',
                  isMock: partialEpisode.isMock || false,
                  linkedFollowUpId: partialEpisode.linkedFollowUpId || null,
                  linkedPrequelId: partialEpisode.linkedPrequelId || null,
              };
              await addEpisodeDb(episodeToAdd, currentUserId);
          }

          toast({ title: "Import Successful", description: `${importedEpisodes.length} item(s) have been added to your planner.` });
        } catch (error: any) {
          toast({ title: "Import Error", description: `Failed to import file: ${error.message}`, variant: "destructive" });
        } finally {
          setIsImportingPlanData(false);
          if (importPlanDataInputRef.current) {
            importPlanDataInputRef.current.value = '';
          }
        }
      };
      reader.readAsText(file);
    }
  };
  
  const fetchUserSpecificData = useCallback(async () => {
    const currentUserId = user?.uid;
    if (currentUserId && currentMode) { 
      setIsLoadingHostName(true);
      setIsLoadingPlannerName(true);
      setIsLoadingUserThemesList(true); 
      setIsLoadingWorkspaces(true);
      try {
        const fetchedHostName = await getCustomHost1Name(currentUserId);
        setCustomHost1NameInput(fetchedHostName || user?.displayName || 'My Username');
        
        const fetchedPlannerName = await getShowPlannerName(currentUserId);
        setPlannerNameInput(fetchedPlannerName || `${currentMode.modeName} Planner`); 

        const themesFromStore = await getUserCustomThemes(currentUserId);
        setUserThemesList(themesFromStore);
        await refreshCustomThemes(); 

        const fetchedWorkspaces = await getUserWorkspaces(currentUserId);
        setSavedWorkspaces(fetchedWorkspaces);

      } catch (error) {
        toast({ title: "Error", description: "Could not load some user preferences, custom themes, or saved projects.", variant: "destructive" });
        setPlannerNameInput(`${currentMode.modeName} Planner`);
      } finally {
        setIsLoadingHostName(false);
        setIsLoadingPlannerName(false);
        setIsLoadingUserThemesList(false);
        setIsLoadingWorkspaces(false);
      }
    } else if (currentMode) {
      setCustomHost1NameInput('My Username');
      setPlannerNameInput(`${currentMode.modeName} Planner`); 
      setUserThemesList([]);
      setSavedWorkspaces([]);
      setIsLoadingHostName(false);
      setIsLoadingPlannerName(false);
      setIsLoadingUserThemesList(false);
      setIsLoadingWorkspaces(false);
    }
  }, [user, toast, refreshCustomThemes, currentMode]); 

  useEffect(() => {
    fetchUserSpecificData();
  }, [fetchUserSpecificData]); 

  const handleSaveHostName = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to save this setting.', variant: 'destructive' });
      return;
    }
    if (!customHost1NameInput.trim()) {
        toast({ title: 'Validation Error', description: 'Your Username cannot be empty.', variant: 'destructive' });
        return;
    }
    setIsLoadingHostName(true);
    try {
      await setCustomHost1Name(user.uid, customHost1NameInput.trim());
      toast({ title: 'Success', description: 'Your preferred username has been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save username.', variant: 'destructive' });
    } finally {
      setIsLoadingHostName(false);
    }
  };

  const handleSavePlannerName = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to save this setting.', variant: 'destructive' });
      return;
    }
    if (!plannerNameInput.trim()) {
        toast({ title: 'Validation Error', description: 'Planner Name cannot be empty.', variant: 'destructive' });
        return;
    }
    setIsLoadingPlannerName(true);
    try {
      await setShowPlannerName(user.uid, plannerNameInput.trim());
      toast({ title: 'Success', description: 'Planner name has been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save planner name.', variant: 'destructive' });
    } finally {
      setIsLoadingPlannerName(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccountAndData();
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error("Delete account process error on settings page:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetApplicationData = async () => {
    if (!user?.uid || !clientDb || confirmResetText.toUpperCase() !== 'RESET') {
      toast({ title: "Error", description: `You must type "RESET" to confirm.`, variant: "destructive" });
      return;
    }
    
    setIsResetting(true);
    try {
      const modeToProvision = ALL_APP_MODES.find(m => m.modeName === selectedModeForReset) || getDefaultAppMode();

      await deleteAllEpisodesForUserDb(user.uid);
      await deleteAllLayoutsForUserDb(user.uid);
      await deleteAllUserCustomThemesForUser(user.uid);
      await deleteAllUserWorkspacesForUser(user.uid);
      
      setSavedWorkspaces([]);
      
      await resetUserPreferencesDb(user.uid, modeToProvision); 

      await updateSettings({
        themeColor: DEFAULT_THEME_NAME,
        hasProvisionedInitialContent: false,
        hasSeenNewEpisodeDefaultsInfo: false,
        showProTips: true,
        highlightAiContent: true,
        guidedTourDashboardCompleted: false,
        guidedTourSettingsCompleted: false,
        selectedAppModeName: modeToProvision.modeName
      });
      
      await setAppContextMode(modeToProvision.modeName);

      await provisionMockEpisodes(user.uid, clientDb, modeToProvision);
      await updateSettings({ hasProvisionedInitialContent: true });

      toast({ title: "Application Reset", description: `Your data has been reset to the ${modeToProvision.modeName} mode.` });
      
      sessionStorage.removeItem('dashboardTourAutoStarted');
      sessionStorage.removeItem('settingsTourAutoStarted');
      window.location.assign('/dashboard');
    } catch (error: any) {
      console.error("Error resetting application data:", error);
      toast({ title: "Reset Failed", description: error.message || "Could not reset application data.", variant: "destructive" });
    } finally {
      setIsResetting(false);
      setConfirmResetText('');
      setShowResetDialog(false);
    }
  };

  const handleChangeAppMode = async (modeName: string) => {
    if(modeName !== currentMode.modeName) {
      await setAppContextMode(modeName);
      toast({ title: "Default Mode Updated", description: `New projects will now default to "${modeName}". This does not affect existing projects.` });
    }
  }
  

  const handleSaveCustomTheme = async () => {
    if (!user?.uid) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    if (!customThemeName.trim()) {
      toast({ title: 'Error', description: 'Theme name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!isValidHexColor(customPrimaryHex) || !isValidHexColor(customSecondaryHex) || !isValidHexColor(customAccentHex)) {
      toast({ title: 'Error', description: 'Please enter valid HEX color codes (e.g., #RRGGBB or #RGB).', variant: 'destructive' });
      return;
    }

    setIsSavingCustomTheme(true);
    try {
      const themeData: Omit<UserCustomTheme, 'id' | 'userId' | 'createdAt'> = {
        name: customThemeName.trim(),
        primaryHex: customPrimaryHex,
        secondaryHex: customSecondaryHex,
        accentHex: customAccentHex,
      };
      const savedTheme = await saveUserCustomTheme(user.uid, themeData);
      const newAppTheme = createAppThemeFromCustomColors(savedTheme.name, savedTheme.id, savedTheme.primaryHex, savedTheme.secondaryHex, savedTheme.accentHex);
      
      await refreshCustomThemes(); 
      setCurrentTheme(newAppTheme.name, newAppTheme.className); 
      await updateSettings({ themeColor: newAppTheme.name });
      setUserThemesList(prev => [...prev, savedTheme].sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)));

      toast({ title: 'Custom Theme Saved!', description: `"${savedTheme.name}" has been saved and applied.` });
      setCustomThemeName('');
    } catch (error) {
      console.error("Error saving custom theme:", error);
      toast({ title: 'Error', description: 'Failed to save custom theme.', variant: 'destructive' });
    } finally {
      setIsSavingCustomTheme(false);
    }
  };

  const handleStartEditingTheme = (theme: UserCustomTheme) => {
    setEditingThemeId(theme.id);
    setEditingThemeName(theme.name);
    setEditingPrimaryHex(theme.primaryHex);
    setEditingSecondaryHex(theme.secondaryHex);
    setEditingAccentHex(theme.accentHex);
  };
  
  const handleCancelEditingTheme = () => {
    setEditingThemeId(null);
  };

  const handleUpdateTheme = async () => {
    if (!editingThemeId || !editingThemeName.trim() || !user?.uid) {
        toast({ title: "Error", description: "Invalid theme name or ID.", variant: "destructive" });
        return;
    }
    if (!isValidHexColor(editingPrimaryHex) || !isValidHexColor(editingSecondaryHex) || !isValidHexColor(editingAccentHex)) {
        toast({ title: 'Error', description: 'Please enter valid HEX color codes (e.g., #RRGGBB or #RGB).', variant: 'destructive' });
        return;
    }

    setIsUpdatingTheme(true);
    try {
        const updates: Partial<UserCustomTheme> = {
            name: editingThemeName.trim(),
            primaryHex: editingPrimaryHex,
            secondaryHex: editingSecondaryHex,
            accentHex: editingAccentHex,
        };
        const updatedTheme = await updateUserCustomTheme(editingThemeId, user.uid, updates);

        setUserThemesList(prev => prev.map(t => t.id === editingThemeId ? { ...t, ...updatedTheme } : t));
        await refreshCustomThemes();

        if (currentThemeClassName === `theme-custom-${editingThemeId}`) {
            const appTheme = createAppThemeFromCustomColors(updatedTheme.name, updatedTheme.id, updatedTheme.primaryHex, updatedTheme.secondaryHex, updatedTheme.accentHex);
            setCurrentTheme(appTheme.name, appTheme.className);
            await updateSettings({ themeColor: appTheme.name });
        }

        toast({ title: "Success", description: "Theme updated." });
        handleCancelEditingTheme();
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to update theme.", variant: "destructive" });
    } finally {
        setIsUpdatingTheme(false);
    }
  };

  const handleDeleteCustomTheme = async (themeId: string, themeName: string) => {
    if (!user?.uid) return;
    setIsLoadingUserThemesList(true); 
    try {
      await deleteUserCustomTheme(themeId, user.uid);
      
      if (settings.themeColor === themeName) {
        await updateSettings({ themeColor: DEFAULT_THEME_NAME });
        setCurrentTheme(DEFAULT_THEME_NAME, PREDEFINED_ALL_THEMES.find(t => t.name === DEFAULT_THEME_NAME)!.className);
      }
      
      await refreshCustomThemes(); 
      setUserThemesList(prev => prev.filter(t => t.id !== themeId));
      toast({ title: 'Custom Theme Deleted', description: `Theme "${themeName}" has been deleted.` });

    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete custom theme.', variant: 'destructive' });
    } finally {
      setIsLoadingUserThemesList(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.uid) {
      toast({ title: "Error", description: "You must be logged in to export data.", variant: "destructive" });
      return;
    }
    setIsExportingData(true);
    try {
      await exportCurrentUserData(user.uid);
      toast({ title: "Data Exported", description: "Your planner data has been downloaded." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message || "Could not export data.", variant: "destructive" });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setJsonFileToImport(file);
      setShowImportConfirmDialog(true);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = ''; 
      }
    }
  };

  const confirmAndExecuteImport = async () => {
    if (!jsonFileToImport || !user?.uid) return;
    setIsImportingData(true);
    setShowImportConfirmDialog(false);
    toast({ title: "Importing Data...", description: "Please wait. This may take a moment.", duration: 7000 });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        await importCurrentUserData(fileContent, user.uid);
      } catch (error: any) {
        toast({ title: "Import Failed", description: error.message || "Could not import data.", variant: "destructive" });
        setIsImportingData(false);
        setJsonFileToImport(null);
      }
    };
    reader.readAsText(jsonFileToImport);
  };

  const handleSaveCurrentWorkspace = async () => {
    if (!user?.uid || !newWorkspaceName.trim()) {
      toast({ title: "Error", description: "Project/Planner name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSavingWorkspace(true);
    try {
      const savedWorkspace = await saveUserWorkspace(user.uid, newWorkspaceName.trim());
      setSavedWorkspaces(prev => [savedWorkspace, ...prev].sort((a, b) => b.savedAt - a.savedAt));
      setNewWorkspaceName('');
      toast({ title: "Project State Saved!", description: `"${savedWorkspace.workspaceName}" has been saved.` });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message || "Could not save project/planner state.", variant: "destructive" });
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleLoadWorkspace = (workspace: UserWorkspace) => {
    setWorkspaceToLoad(workspace);
    setShowLoadWorkspaceConfirmDialog(true);
  };

  const confirmAndExecuteLoadWorkspace = async () => {
    if (!workspaceToLoad || !user?.uid) return;
    setIsApplyingWorkspace(true);
    setShowLoadWorkspaceConfirmDialog(false);
    toast({ title: "Loading Project...", description: `Restoring "${workspaceToLoad.workspaceName}". The app will now reload.`, duration: 8000 });
    try {
      await applyUserWorkspace(user.uid, workspaceToLoad);
    } catch (error: any) {
      toast({ title: "Load Failed", description: error.message || "Could not load project/planner state.", variant: "destructive" });
      setIsApplyingWorkspace(false);
      setWorkspaceToLoad(null);
    }
  };

  const handleDeleteWorkspace = (workspace: UserWorkspace) => {
    setWorkspaceToDelete(workspace);
    setShowDeleteWorkspaceConfirmDialog(true);
  };

  const confirmAndExecuteDeleteWorkspace = async () => {
    if (!workspaceToDelete || !user?.uid) return;
    setIsDeletingWorkspace(true);
    setShowDeleteWorkspaceConfirmDialog(false);
    try {
      await deleteUserWorkspace(workspaceToDelete.id, user.uid);
      setSavedWorkspaces(prev => prev.filter(ws => ws.id !== workspaceToDelete.id));
      toast({ title: "Project Deleted", description: `"${workspaceToDelete.workspaceName}" has been deleted.`});
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message || "Could not delete project/planner state.", variant: "destructive" });
    } finally {
      setIsDeletingWorkspace(false);
      setWorkspaceToDelete(null);
    }
  };

  const pageIsLoading = authLoading || loadingSettings || isLoadingHostName || isLoadingPlannerName || isLoadingUserThemesList || isLoadingContextThemes || isLoadingWorkspaces;
  
  const handleThemeKeyDown = useCallback(async (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = availableThemes.findIndex(theme => theme.name === currentThemeName);
      let nextIndex;
      if (availableThemes.length === 0) return;
      if (event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % availableThemes.length;
      } else { 
        nextIndex = (currentIndex - 1 + availableThemes.length) % availableThemes.length;
      }
      const nextTheme = availableThemes[nextIndex];
      if (nextTheme) {
        setCurrentTheme(nextTheme.name, nextTheme.className);
        await updateSettings({ themeColor: nextTheme.name });
      }
    }
  }, [availableThemes, currentThemeName, setCurrentTheme, updateSettings]);
  
  return (
    <TooltipProvider>
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <AlertDialog open={showLoadWorkspaceConfirmDialog} onOpenChange={setShowLoadWorkspaceConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load "{workspaceToLoad?.workspaceName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current workspace, including all items, layouts, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplyingWorkspace} onClick={() => setWorkspaceToLoad(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndExecuteLoadWorkspace} disabled={isApplyingWorkspace} className="bg-primary hover:bg-primary/90">
              {isApplyingWorkspace ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Yes, Load Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={showImportConfirmDialog} onOpenChange={setShowImportConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import and Replace Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current workspace, including all items, layouts, and settings, with the data from the selected file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImportingData} onClick={() => setJsonFileToImport(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndExecuteImport} disabled={isImportingData} className="bg-primary hover:bg-primary/90">
              {isImportingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Yes, Import & Replace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAppModeConfirmDialog} onOpenChange={setShowAppModeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Application Mode to "{pendingModeName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your current items, layouts, and saved project states to set up your new workspace. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {}} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">
              {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Yes, Change Mode & Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary mb-6 flex items-center"><SettingsIcon className="mr-3 h-8 w-8"/>General Settings</h1>
        <Button variant="outline" size="sm" onClick={() => setIsTourOpen(true)}><HelpCircle className="mr-2 h-4 w-4"/> Page Tour</Button>
      </div>
      
      {isTourOpen && <GuidedTour steps={settingsTourSteps} isOpen={isTourOpen} onClose={handleTourClose} tourKey="settings-tour-main"/>}
      
      <div className="space-y-8">
        <Card data-tour-id="settings-workspace-config">
            <CardHeader>
              <CardTitle className="flex items-center text-primary"><UserCog className="mr-2 h-5 w-5" />Workspace Configuration</CardTitle>
              <CardDescription>Manage your workspace name and your preferred username.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="plannerNameInput">Planner Name</Label>
                  {isLoadingPlannerName ? (
                    <div className="flex items-center py-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                  ) : (
                    <Input id="plannerNameInput" value={plannerNameInput} onChange={(e) => setPlannerNameInput(e.target.value)} placeholder={`E.g., My ${currentMode.modeName} Projects`} disabled={authLoading} className="bg-background"/>
                  )}
                  <Button onClick={handleSavePlannerName} disabled={isLoadingPlannerName || authLoading || !plannerNameInput.trim()} size="sm">
                    {isLoadingPlannerName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Planner Name
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customHost1Name">Your Preferred Username</Label>
                  {isLoadingHostName ? (
                    <div className="flex items-center py-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                  ) : (
                    <Input id="customHost1Name" value={customHost1NameInput} onChange={(e) => setCustomHost1NameInput(e.target.value)} placeholder="E.g., Your Name, Your Channel" disabled={authLoading} className="bg-background"/>
                  )}
                  <p className="text-xs text-muted-foreground">This name is used for your primary content fields and when you share content.</p>
                  <Button onClick={handleSaveHostName} disabled={isLoadingHostName || authLoading || !customHost1NameInput.trim()} size="sm">
                    {isLoadingHostName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Username
                  </Button>
                </div>
            </CardContent>
          </Card>

          <Card data-tour-id="settings-appearance">
            <CardHeader>
              <CardTitle className="flex items-center text-primary"><Paintbrush className="mr-2 h-5 w-5"/>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="themeSelectorGeneral">Theme Palette</Label>
                <Select value={currentThemeName} onValueChange={async (newThemeName) => {
                    const themeToApply = availableThemes.find(t => t.name === newThemeName);
                    if (themeToApply) {
                        setCurrentTheme(themeToApply.name, themeToApply.className);
                        await updateSettings({ themeColor: newThemeName });
                    }
                }} disabled={pageIsLoading}>
                  <SelectTrigger id="themeSelectorGeneral" className="bg-background" onKeyDown={handleThemeKeyDown} aria-label="Select application theme. Use arrow keys to cycle when closed.">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableThemes.map((theme) => (
                      <SelectItem key={`${theme.name}-${theme.className}`} value={theme.name}>{theme.name} {theme.className.startsWith('theme-custom-') && '(Custom)'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">Changes are saved automatically and applied instantly.</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="showProTipsSwitch">Show "Pro Tip" on Dashboard</Label>
                  <p className="text-xs text-muted-foreground">Display a helpful tip card on the dashboard.</p>
                </div>
                <Switch id="showProTipsSwitch" checked={settings.showProTips ?? true} onCheckedChange={(checked) => updateSettings({ showProTips: checked })} disabled={loadingSettings}/>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="highlightAiContentSwitch">Highlight AI-Generated Content</Label>
                  <p className="text-xs text-muted-foreground">Display a visual highlight on items created by the AI.</p>
                </div>
                <Switch id="highlightAiContentSwitch" checked={settings.highlightAiContent ?? true} onCheckedChange={(checked) => updateSettings({ highlightAiContent: checked })} disabled={loadingSettings}/>
              </div>
            </CardContent>
          </Card>
      
        <Card id="custom-themes-card">
          <CardHeader>
              <CardTitle className="flex items-center text-primary"><Palette className="mr-2 h-5 w-5"/>Custom Themes</CardTitle>
              <CardDescription>Create your own color themes or manage your saved ones.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-6">
            <div className="p-4 border rounded-md space-y-4 bg-muted/30">
              <h3 className="text-md font-semibold text-foreground">Create New Custom Theme</h3>
              <div className="space-y-2">
                <Label htmlFor="customThemeName">Theme Name</Label>
                <Input id="customThemeName" value={customThemeName} onChange={(e) => setCustomThemeName(e.target.value)} placeholder="E.g., My Awesome Theme" className="bg-background"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="customPrimaryHex">Primary</Label>
                  <Input type="color" id="customPrimaryHex" value={customPrimaryHex} onChange={(e) => setCustomPrimaryHex(e.target.value)} className="w-full h-10 p-1 bg-background cursor-pointer"/>
                  <Input type="text" value={customPrimaryHex} onChange={(e) => setCustomPrimaryHex(e.target.value)} placeholder="#A78BFA" className="w-full bg-background h-10 text-center text-sm" maxLength={7} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customSecondaryHex">Secondary</Label>
                  <Input type="color" id="customSecondaryHex" value={customSecondaryHex} onChange={(e) => setCustomSecondaryHex(e.target.value)} className="w-full h-10 p-1 bg-background cursor-pointer" />
                  <Input type="text" value={customSecondaryHex} onChange={(e) => setCustomSecondaryHex(e.target.value)} placeholder="#7DD3FC" className="w-full bg-background h-10 text-center text-sm" maxLength={7} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customAccentHex">Accent</Label>
                  <Input type="color" id="customAccentHex" value={customAccentHex} onChange={(e) => setCustomAccentHex(e.target.value)} className="w-full h-10 p-1 bg-background cursor-pointer" />
                  <Input type="text" value={customAccentHex} onChange={(e) => setCustomAccentHex(e.target.value)} placeholder="#FACD3D" className="w-full bg-background h-10 text-center text-sm" maxLength={7} />
                </div>
              </div>
              <Button onClick={handleSaveCustomTheme} disabled={isSavingCustomTheme || pageIsLoading || !customThemeName.trim() || !isValidHexColor(customPrimaryHex) || !isValidHexColor(customSecondaryHex) || !isValidHexColor(customAccentHex)}>
                {isSavingCustomTheme ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save Custom Theme
              </Button>
            </div>
            <div>
              <h3 className="text-md font-semibold text-foreground mb-3">Your Saved Themes</h3>
              {isLoadingUserThemesList || isLoadingContextThemes ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
              ) : userThemesList.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't created any custom themes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {userThemesList.map(theme => (
                    <li key={theme.id} className="p-3 border rounded-md bg-card flex flex-col gap-3">
                      {editingThemeId === theme.id ? (
                        // EDITING STATE
                        <div className="space-y-4">
                          <Input value={editingThemeName} onChange={(e) => setEditingThemeName(e.target.value)} className="h-8 text-sm font-medium" autoFocus />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs">Primary</Label>
                                <Input type="color" value={editingPrimaryHex} onChange={(e) => setEditingPrimaryHex(e.target.value)} className="w-full h-8 p-1"/>
                                <Input type="text" value={editingPrimaryHex} onChange={(e) => setEditingPrimaryHex(e.target.value)} maxLength={7} className="w-full h-8 text-xs text-center"/>
                            </div>
                            <div>
                                <Label className="text-xs">Secondary</Label>
                                <Input type="color" value={editingSecondaryHex} onChange={(e) => setEditingSecondaryHex(e.target.value)} className="w-full h-8 p-1"/>
                                <Input type="text" value={editingSecondaryHex} onChange={(e) => setEditingSecondaryHex(e.target.value)} maxLength={7} className="w-full h-8 text-xs text-center"/>
                            </div>
                            <div>
                                <Label className="text-xs">Accent</Label>
                                <Input type="color" value={editingAccentHex} onChange={(e) => setEditingAccentHex(e.target.value)} className="w-full h-8 p-1"/>
                                <Input type="text" value={editingAccentHex} onChange={(e) => setEditingAccentHex(e.target.value)} maxLength={7} className="w-full h-8 text-xs text-center"/>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={handleUpdateTheme} disabled={isUpdatingTheme}>{isUpdatingTheme ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes</Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEditingTheme}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        // DISPLAY STATE
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <span className="text-sm font-medium text-card-foreground truncate flex-shrink-0" title={theme.name}>{theme.name}</span>
                            <div className="flex items-center gap-4 flex-grow justify-start sm:justify-center">
                                <div className="flex items-center gap-1">
                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: theme.primaryHex }}></div>
                                    <span className="text-xs font-mono text-muted-foreground">{theme.primaryHex}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: theme.secondaryHex }}></div>
                                    <span className="text-xs font-mono text-muted-foreground">{theme.secondaryHex}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: theme.accentHex }}></div>
                                    <span className="text-xs font-mono text-muted-foreground">{theme.accentHex}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                <Button variant="outline" size="sm" onClick={async () => { const appTheme = createAppThemeFromCustomColors(theme.name, theme.id, theme.primaryHex, theme.secondaryHex, theme.accentHex); setCurrentTheme(appTheme.name, appTheme.className); await updateSettings({ themeColor: appTheme.name }); }} disabled={pageIsLoading}>Apply</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEditingTheme(theme)}><Edit3 className="h-4 w-4" /></Button>
                                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" disabled={pageIsLoading}><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Custom Theme?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the theme "{theme.name}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCustomTheme(theme.id, theme.name)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                            </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card id="manage-workspaces" data-tour-id="settings-manage-states">
          <CardHeader>
            <CardTitle className="flex items-center text-primary"><FolderOpen className="mr-2 h-5 w-5"/>Manage Project/Planner States</CardTitle>
            <CardDescription>Save or load named snapshots of your entire workspace, including all items, layouts, and settings. This is useful for backups or managing different projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="p-4 border rounded-md space-y-4 bg-muted/30">
                  <h3 className="text-md font-semibold text-foreground">Save Current State</h3>
                  <div className="space-y-2">
                      <Label htmlFor="newWorkspaceName">State Name</Label>
                      <Input id="newWorkspaceName" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="E.g., Pre-Season 2 Backup" className="bg-background"/>
                  </div>
                  <Button onClick={handleSaveCurrentWorkspace} disabled={isSavingWorkspace || pageIsLoading || !newWorkspaceName.trim()}>
                      {isSavingWorkspace ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FolderPlus className="mr-2 h-4 w-4"/>} Save Current Project State
                  </Button>
              </div>
              <div>
                  <h3 className="text-md font-semibold text-foreground mb-3">Load Full Project</h3>
                  {isLoadingWorkspaces ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
                  ) : savedWorkspaces.length === 0 ? (
                      <p className="text-sm text-muted-foreground">You haven't saved any project states yet.</p>
                  ) : (
                      <ScrollArea className="h-auto max-h-72 pr-4">
                          <ul className="space-y-2">
                              {savedWorkspaces.map(ws => (
                                  <li key={ws.id} className="flex items-center justify-between p-3 border rounded-md bg-card flex-wrap gap-y-2">
                                      <div className="flex-grow">
                                          <p className="text-sm font-medium text-card-foreground">{ws.workspaceName}</p>
                                          <p className="text-xs text-muted-foreground">Saved: {format(ws.savedAt, 'PPP p')} ({ws.episodes.length} items)</p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                          <Button variant="outline" size="sm" className="h-8" onClick={() => handleLoadWorkspace(ws)} disabled={pageIsLoading || isApplyingWorkspace || isDeletingWorkspace}>
                                              {isApplyingWorkspace && workspaceToLoad?.id === ws.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FolderSymlink className="mr-2 h-4 w-4"/>} Load
                                          </Button>
                                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteWorkspace(ws)} disabled={pageIsLoading || isApplyingWorkspace || isDeletingWorkspace}>
                                            {isDeletingWorkspace && workspaceToDelete?.id === ws.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                          </Button>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </ScrollArea>
                  )}
              </div>
          </CardContent>
        </Card>
        
        <Card data-tour-id="settings-data-file" id="file-importer-card">
          <CardHeader>
            <CardTitle className="flex items-center text-primary"><DownloadCloud className="mr-2 h-5 w-5"/>Export/Import Data Files</CardTitle>
            <CardDescription>Export your entire workspace for backup, or import files to manage your content.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleExportData} disabled={isExportingData || pageIsLoading} className="w-full">
                    {isExportingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <DownloadCloud className="mr-2 h-4 w-4"/>} Export My Data
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Saves a complete backup of everything in your workspace—all items, layouts, settings, and custom themes—into a single JSON file on your computer.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => importFileInputRef.current?.click()} disabled={isImportingData || pageIsLoading} variant="outline" className="w-full">
                    {isImportingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import & Replace
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Loads a workspace from a previously exported data file. <span className="font-semibold text-destructive">Warning:</span> This will completely replace your current workspace with the content from the file.</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => importPlanDataInputRef.current?.click()} disabled={isImportingPlanData || pageIsLoading} variant="outline" className="w-full lg:col-span-1">
                      {isImportingPlanData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />} Import & Add Plan
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                   <p className="max-w-xs">Adds new items to your current workspace from a structured JSON or Markdown file. This is perfect for importing plans from collaborators or AI tools without losing your existing work.</p>
                </TooltipContent>
              </Tooltip>

              <input type="file" ref={importFileInputRef} onChange={handleImportFileChange} accept=".json" className="hidden" id="import-data-input" />
              <input type="file" ref={importPlanDataInputRef} onChange={handleImportPlanDataFileChange} accept=".json,.md" className="hidden" id="import-plan-data-input" />
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">"Import & Replace" overwrites all data. "Import & Add Plan" adds new items from a structured JSON or Markdown file without deleting existing data.</p>
          </CardFooter>
        </Card>

        <Card data-tour-id="settings-app-mode">
          <CardHeader>
            <CardTitle className="flex items-center text-primary"><Wand2 className="mr-2 h-5 w-5"/>Default Application Mode</CardTitle>
            <CardDescription>
              Set the default Application Mode for any new seasons you create. You can link a different mode to each season individually on the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="appModeSelector">Default Mode for New Projects</Label>
              <Select value={currentMode.modeName} onValueChange={handleChangeAppMode} disabled={pageIsLoading || isResetting}>
                <SelectTrigger id="appModeSelector" className="max-w-md bg-background">
                  <SelectValue placeholder="Select a mode..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_APP_MODES.map((mode) => (
                    <SelectItem key={mode.modeName} value={mode.modeName}>{mode.modeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      
        <Card data-tour-id="settings-danger-zone">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5" /> Danger Zone</CardTitle>
            <CardDescription>Perform irreversible actions like resetting all application data or deleting your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-destructive/30 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-destructive">Reset Application Data</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        This will delete all your items and layouts, and then provision new sample data for the Application Mode you select. Your user account will not be deleted.
                    </p>
                </div>
                <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-shrink-0" disabled={pageIsLoading || isResetting}>
                            <RefreshCcw className="mr-2 h-4 w-4" /> Reset Data
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Reset All Application Data?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will permanently delete all your items, layouts, custom themes, and saved project states. It will then provision fresh sample data for the Application Mode you choose below. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-2">
                          <Label htmlFor="modeSelectForReset">Provision new data for:</Label>
                          <Select value={selectedModeForReset} onValueChange={setSelectedModeForReset}>
                              <SelectTrigger id="modeSelectForReset">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  {ALL_APP_MODES.map(mode => (
                                      <SelectItem key={mode.modeName} value={mode.modeName}>{mode.modeName}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                        </div>
                        <div className="py-2">
                          <Label htmlFor="confirmResetInput">To confirm, type "RESET" below:</Label>
                          <Input
                            id="confirmResetInput"
                            value={confirmResetText}
                            onChange={(e) => setConfirmResetText(e.target.value)}
                            placeholder='Type "RESET"'
                            className="mt-1"
                          />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isResetting} onClick={() => setConfirmResetText('')}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetApplicationData} disabled={isResetting || confirmResetText.toUpperCase() !== 'RESET'} className="bg-destructive hover:bg-destructive/90">
                                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm & Reset"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="p-4 border border-destructive/30 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                <div>
                    <h3 className="font-semibold text-destructive">Delete User Account</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        This will permanently delete your user account and all associated data from PlotForm Ai Production Planner. This is the final step and cannot be recovered.
                    </p>
                </div>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={authLoading || isDeleting} className="flex-shrink-0">
                            {isDeleting || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account,
                                all associated items, layouts, themes, and saved project states.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || authLoading}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Yes, Delete My Account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}
