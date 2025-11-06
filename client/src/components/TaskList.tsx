// client/src/components/TaskList.tsx
import { format } from "date-fns";
import { CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { completeTask } from "@/hooks/useFirestoreTasks";
import { Task } from "@shared/schema";

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const { toast } = useToast();

  // ────── DEBUG: See what tasks are received ──────
  console.log("TaskList received tasks:", tasks);

  // ────── Filter active tasks ──────
  const activeTasks = tasks.filter((task) => task.status === "active");
  console.log("Active tasks:", activeTasks);

  // ────── Complete task handler ──────
  const handleComplete = async (id: string) => {
    try {
      await completeTask(id);
      toast({
        title: "Task completed",
        description: "Marked as done.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  if (activeTasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No active tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeTasks.map((task) => (
        <Card key={task.id} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Title */}
                <h3 className="font-medium text-gray-900">{task.title}</h3>

                {/* Description */}
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}

                {/* Context & Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.context && (
                    <Badge variant="outline" className="text-xs">
                      @{task.context}
                    </Badge>
                  )}
                  {task.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      +{tag}
                    </Badge>
                  ))}
                </div>

                {/* Due Date */}
                {task.dueDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </p>
                )}
              </div>

              {/* Complete Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleComplete(task.id)}
                className="ml-3"
              >
                <Circle className="h-5 w-5 text-gray-400 hover:text-green-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
