

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_NAME } from '@/lib/constants';
import { LogOut, LayoutDashboard, Settings, CalendarDays, Moon, Sun, BookOpen, ListTree, Sparkles as SparklesIcon, Save, FolderOpen, Loader2, Inbox as InboxIcon, Users, Construction } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCustomTheme } from '@/contexts/CustomThemeContext';
import { useEffect, useState } from 'react';
import { saveUserWorkspace } from '@/lib/userWorkspacesStore'; 
import { useToast } from '@/hooks/use-toast'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Inbox } from '@/components/inbox/Inbox';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { cycleTheme: cycleCustomTheme } = useCustomTheme();
  const [mounted, setMounted] = useState(false);
  const [logoTimestamp, setLogoTimestamp] = useState<number>(Date.now());

  const [showSaveWorkspaceDialog, setShowSaveWorkspaceDialog] = useState(false);
  const [newWorkspaceNameNavbar, setNewWorkspaceNameNavbar] = useState('');
  const [isSavingWorkspaceNavbar, setIsSavingWorkspaceNavbar] = useState(false);
  const { toast } = useToast();
  
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLogoTimestamp(Date.now()); // Bust cache on component mount/re-render
  }, []);

  const handleSaveCurrentWorkspaceNavbar = async () => {
    if (!user?.uid || !newWorkspaceNameNavbar.trim()) {
      toast({ title: "Error", description: "Project/Planner name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSavingWorkspaceNavbar(true);
    try {
      const savedWorkspace = await saveUserWorkspace(user.uid, newWorkspaceNameNavbar.trim());
      setNewWorkspaceNameNavbar('');
      setShowSaveWorkspaceDialog(false); 
      toast({ 
        title: "Project State Saved!", 
        description: `"${savedWorkspace.workspaceName}" has been saved. The updated list will be visible in General Settings.`,
        duration: 7000 
      });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message || "Could not save project/planner state.", variant: "destructive" });
    } finally {
      setIsSavingWorkspaceNavbar(false);
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name || name.trim() === '') return 'P';
    const names = name.trim().split(' ').filter(n => n);

    if (names.length > 1 && names[0].length > 0 && names[1].length > 0) {
      const firstInitial = names[0][0];
      const secondInitial = names[1][0];
      return `${firstInitial}${secondInitial}`.toUpperCase();
    }
    if (names.length > 0 && names[0].length > 0) {
      return names[0][0].toUpperCase();
    }
    return 'P';
  };

  return (
    <>
      <nav className="bg-muted shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group p-1 rounded-md transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Image
                  src={`/logo.png?t=${logoTimestamp}`}
                  alt="PlotForm Ai Production Planner Logo"
                  width={48}
                  height={48}
                  key={logoTimestamp}
                  sizes="48px"
                  priority
                />
              </Link>
            </div>
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Link href="/dashboard" passHref>
                  <Button variant="ghost" className="text-foreground hover:bg-accent/20">
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
                  </Button>
                </Link>
                
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" className="text-foreground opacity-50 cursor-not-allowed pointer-events-none">
                      <Users className="mr-2 h-5 w-5" /> Community 🚧
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Coming Soon!</p></TooltipContent>
                </Tooltip>

                <Link href="/calendar" passHref>
                  <Button variant="ghost" className="text-foreground hover:bg-accent/20">
                    <CalendarDays className="mr-2 h-5 w-5" /> Calendar
                  </Button>
                </Link>

                {mounted && (
                  <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <span className="relative flex h-10 w-10">
                              <Button variant="ghost" size="icon" className="text-foreground opacity-50 cursor-not-allowed pointer-events-none">
                                  <InboxIcon className="h-5 w-5" />
                              </Button>
                              <span className="absolute top-1 right-1 text-yellow-500"><Construction className="h-3 w-3" /></span>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent><p>Inbox (Coming Soon!)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cycleCustomTheme}
                          aria-label="Cycle custom theme"
                          className="text-foreground hover:bg-accent/20"
                          data-tour-id="navbar-theme-cycle"
                        >
                          <SparklesIcon className="h-5 w-5 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cycle Theme</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          aria-label="Toggle light/dark mode"
                          className="text-foreground hover:bg-accent/20"
                          data-tour-id="navbar-dark-mode-toggle"
                        >
                          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-primary" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle Dark/Light Mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}

                {loading ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-card"></div>
                ) : user ? (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-tour-id="navbar-user-menu">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={user.photoURL || undefined}
                                alt={user.displayName || 'User'}
                                data-ai-hint="user avatar"
                              />
                              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>User Menu</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setShowSaveWorkspaceDialog(true)}>
                        <Save className="mr-2 h-4 w-4" />Save Current State
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings#manage-workspaces">
                          <FolderOpen className="mr-2 h-4 w-4" />Load Full Project
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />General Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings/layouts">
                          <ListTree className="mr-2 h-4 w-4" />Manage Layouts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/tutorial">
                          <BookOpen className="mr-2 h-4 w-4" />
                          How to Use Guide
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login" passHref>
                    <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </nav>
      <Inbox isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />

      <Dialog open={showSaveWorkspaceDialog} onOpenChange={setShowSaveWorkspaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Project State</DialogTitle>
            <DialogDescription>
              Enter a name to save the current state of all your items, layouts, and settings. This creates a snapshot you can load later from General Settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="newWorkspaceNameNavbar">State Name</Label>
            <Input
              id="newWorkspaceNameNavbar"
              value={newWorkspaceNameNavbar}
              onChange={(e) => setNewWorkspaceNameNavbar(e.target.value)}
              placeholder="E.g., My Podcast - Season 1, Book Draft Alpha"
              disabled={isSavingWorkspaceNavbar}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSavingWorkspaceNavbar}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveCurrentWorkspaceNavbar} disabled={isSavingWorkspaceNavbar || !newWorkspaceNameNavbar.trim()}>
              {isSavingWorkspaceNavbar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save State
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
