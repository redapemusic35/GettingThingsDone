import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { parseTaskSyntax } from "@/lib/taskParser";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function NewTaskModal({ 
  isOpen, 
  onClose,
  onTaskAdded
}: NewTaskModalProps) {
  const { toast } = useToast();
  const [taskInput, setTaskInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (isSubmitting || !taskInput.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Parse the input using the GTD syntax parser
      const parsedTask = parseTaskSyntax(taskInput.trim());
      
      // Create the new task
      await apiRequest('POST', '/api/tasks', {
        ...parsedTask,
        notes: notes.trim(),
        completed: false,
      });
      
      toast({
        title: "Task created",
        description: "Your new task has been added.",
      });
      
      // Reset the form
      setTaskInput("");
      setNotes("");
      
      // Close the modal and notify parent
      onClose();
      onTaskAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create the task.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="mb-4">
            <Label htmlFor="new-task-input">Task Description with GTD Syntax</Label>
            <Input 
              id="new-task-input" 
              value={taskInput} 
              onChange={(e) => setTaskInput(e.target.value)} 
              placeholder="Task description +@context +tag pro:project due:YYYY-MM-DD"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Example: "Buy groceries +@home +shopping pro:household due:2023-05-10"
            </p>
            <p className="mt-1 text-xs text-gray-500">
              <strong>Syntax guide:</strong> +@context (where to do it), +tag (category), pro:project (group of related tasks), due:YYYY-MM-DD (deadline)
            </p>
          </div>
          
          <div>
            <Label htmlFor="new-task-notes">Notes (optional)</Label>
            <Textarea 
              id="new-task-notes" 
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !taskInput.trim()}>
            {isSubmitting ? "Adding..." : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
