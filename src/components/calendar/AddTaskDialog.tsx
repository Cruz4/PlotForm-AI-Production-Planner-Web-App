
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addTask } from '@/lib/taskStore';
import { cn } from '@/lib/utils';

interface AddTaskDialogProps {
  onTaskAdded: () => void;
}

export function AddTaskDialog({ onTaskAdded }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setDueDate(undefined);
  };

  const handleAddTask = async () => {
    if (!user || !title || !dueDate) {
      toast({ title: "Missing Information", description: "Title and Due Date are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await addTask(user.uid, { title, notes, dueDate: dueDate.getTime() });
      toast({ title: "Task Added", description: `"${title}" has been added to your calendar.` });
      onTaskAdded();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onPointerDownOutside={(e) => { if (isSaving) e.preventDefault(); }}>
        <DialogHeader><DialogTitle>Add New Task or Deadline</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <Input placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, 'PPP') : <span>Pick a due date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus /></PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
          <Button onClick={handleAddTask} disabled={isSaving || !title || !dueDate}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
