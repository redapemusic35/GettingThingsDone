import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import TaskList from "@/components/TaskList";
import ContextFilter from "@/components/ContextFilter";
import TagFilter from "@/components/TagFilter";
import NewTaskModal from "@/components/NewTaskModal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Get all tasks, filtered by context or tag
  const tasksQuery = useQuery<Task[]>({
    queryKey: selectedTag
      ? [`/api/tasks/tag/${selectedTag}`]
      : selectedContext
        ? [`/api/tasks/context/${selectedContext}`]
        : ['/api/tasks/active'],
  });

  // Get all unique contexts and tags for the filters
  const allTasksQuery = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const contexts = allTasksQuery.data
    ? Array.from(new Set(allTasksQuery.data
        .map(task => task.context)
        .filter(context => context !== undefined && context !== null) as string[]))
    : [];

  const tags = allTasksQuery.data
    ? Array.from(new Set(allTasksQuery.data
        .flatMap(task => task.tags || [])
        .filter(tag => tag !== undefined && tag !== null)))
    : [];

  const handleContextSelect = (context: string | null) => {
    setSelectedContext(context);
    // Reset tag filter when context changes
    if (selectedTag) setSelectedTag(null);
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    // Reset context filter when tag changes
    if (selectedContext) setSelectedContext(null);
  };

  if (tasksQuery.isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 w-full">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="w-full">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasksQuery.isError) {
    toast({
      title: "Error",
      description: "Failed to load tasks. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <>
      <TaskList tasks={tasksQuery.data || []} />

      <ContextFilter
        contexts={contexts}
        selectedContext={selectedContext}
        onSelectContext={handleContextSelect}
      />

      <TagFilter
        tags={tags}
        selectedTag={selectedTag}
        onSelectTag={handleTagSelect}
      />

      <div className="fixed right-4 bottom-40 z-20">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsNewTaskModalOpen(true)}
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onTaskAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          queryClient.invalidateQueries({ queryKey: ['/api/tasks/active'] });

          // Invalidate context-specific queries
          if (selectedContext) {
            queryClient.invalidateQueries({ queryKey: [`/api/tasks/context/${selectedContext}`] });
          }

          // Invalidate tag-specific queries
          if (selectedTag) {
            queryClient.invalidateQueries({ queryKey: [`/api/tasks/tag/${selectedTag}`] });
          }
        }}
      />
    </>
  );
}
