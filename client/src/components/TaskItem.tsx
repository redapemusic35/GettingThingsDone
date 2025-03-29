import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { Archive, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TaskItemProps {
  task: Task;
  onClick: () => void;
}

export default function TaskItem({ task, onClick }: TaskItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isArchiving, setIsArchiving] = useState(false);
  
  const handleArchiveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isArchiving) return;
    
    try {
      setIsArchiving(true);
      await apiRequest('PUT', `/api/tasks/${task.id}/complete`, {});
      
      toast({
        title: "Task archived",
        description: "The task has been moved to the archive.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/active'] });
      if (task.context) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/context/${task.context}`] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive the task.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };
  
  // Format due date if it exists
  let formattedDueDate = null;
  if (task.dueDate) {
    try {
      const date = parseISO(task.dueDate);
      if (isValid(date)) {
        formattedDueDate = format(date, 'MMM d, yyyy');
      }
    } catch {
      // Invalid date format, skip formatting
    }
  }
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <button
            className="mt-0.5 h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={handleArchiveClick}
          ></button>
          <div>
            <h3 className="text-base font-medium text-gray-900">{task.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {task.context && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                  @{task.context}
                </Badge>
              )}
              
              {task.tags && task.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  +{tag}
                </Badge>
              ))}
              
              {formattedDueDate && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formattedDueDate}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost" 
          size="icon"
          onClick={handleArchiveClick}
          disabled={isArchiving}
        >
          <Archive className="h-5 w-5 text-gray-400 hover:text-gray-500" />
        </Button>
      </div>
    </div>
  );
}
