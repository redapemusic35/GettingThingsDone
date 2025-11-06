import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Archive() {
  const { tasks } = useFirestoreTasks("archive");
  const queryClient = useQueryClient();

  const completedTasksQuery = useQuery<Task[]>({
    queryKey: ['/api/tasks/completed'],
  });

  const handleRestoreTask = async (id: number) => {
    try {
      await apiRequest('PUT', `/api/tasks/${id}/restore`, {});
      toast({
        title: "Task restored",
        description: "The task has been moved back to the active list.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/active'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore the task.",
        variant: "destructive",
      });
    }
  };

  if (completedTasksQuery.isLoading) {
    return (
      <Card>
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <CardTitle>Archived Tasks</CardTitle>
          <p className="mt-1 text-sm text-gray-500">View your completed tasks</p>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-gray-200">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-3 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (completedTasksQuery.isError) {
    toast({
      title: "Error",
      description: "Failed to load archived tasks. Please try again.",
      variant: "destructive",
    });
  }

  const completedTasks = completedTasksQuery.data || [];

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle>Archived Tasks</CardTitle>
        <p className="mt-1 text-sm text-gray-500">View your completed tasks</p>
      </CardHeader>
      <CardContent className="p-0">
        {completedTasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {completedTasks.map((task) => (
              <li key={task.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-through">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.context && `@${task.context}`} {task.tags?.map(tag => `+${tag}`).join(' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Completed on {task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRestoreTask(task.id)}
                    title="Restore task"
                  >
                    <RefreshCw className="h-5 w-5 text-gray-400 hover:text-primary" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-500">No archived tasks yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
