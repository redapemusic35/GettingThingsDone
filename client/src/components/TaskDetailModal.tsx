import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, parseISO, isValid } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTaskToSyntax, parseTaskSyntax } from "@/lib/taskParser";

interface TaskDetailModalProps {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
}

export default function TaskDetailModal({ 
  isOpen, 
  task, 
  onClose 
}: TaskDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [taskSyntax, setTaskSyntax] = useState(formatTaskToSyntax(task));
  const [notes, setNotes] = useState(task.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  
  // Format dates for display
  const formattedDueDate = task.dueDate 
    ? (() => {
        try {
          const date = parseISO(task.dueDate!);
          return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
        } catch {
          return 'Invalid date';
        }
      })()
    : 'None';
    
  const formattedCreatedDate = task.createdAt 
    ? format(new Date(task.createdAt), 'MMM d, yyyy') 
    : 'Unknown';
  
  const handleSave = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      // Parse the task syntax to extract title, context, tags, and due date
      const parsedTask = parseTaskSyntax(taskSyntax);
      
      // Update the task with the new data
      await apiRequest('PUT', `/api/tasks/${task.id}`, {
        ...parsedTask,
        notes,
      });
      
      toast({
        title: "Task updated",
        description: "Your changes have been saved.",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/active'] });
      
      // Invalidate context queries
      if (task.context) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/context/${task.context}`] });
      }
      if (parsedTask.context) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/context/${parsedTask.context}`] });
      }
      
      // Invalidate project queries
      if (task.project) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/project/${task.project}`] });
      }
      if (parsedTask.project) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/project/${parsedTask.project}`] });
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the task.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="mb-4">
            <Label htmlFor="task-syntax">Task Syntax</Label>
            <Input 
              id="task-syntax" 
              value={taskSyntax} 
              onChange={(e) => setTaskSyntax(e.target.value)} 
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Context</Label>
              <div className="mt-1 text-sm text-gray-900">{task.context ? `@${task.context}` : 'None'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Project</Label>
              <div className="mt-1 text-sm text-gray-900">{task.project || 'None'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Tags</Label>
              <div className="mt-1 text-sm text-gray-900">
                {task.tags && task.tags.length > 0 
                  ? task.tags.map(tag => `+${tag}`).join(', ') 
                  : 'None'}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Due Date</Label>
              <div className="mt-1 text-sm text-gray-900">{formattedDueDate}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Created</Label>
              <div className="mt-1 text-sm text-gray-900">{formattedCreatedDate}</div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea 
              id="task-notes" 
              rows={4} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Add notes here..."
              className="mt-1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
