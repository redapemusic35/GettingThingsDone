// client/src/pages/Home.tsx
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TaskList from "@/components/TaskList";
import ContextFilter from "@/components/ContextFilter";
import TagFilter from "@/components/TagFilter";
import NewTaskModal from "@/components/NewTaskModal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import { Task } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // ────── MAIN TASK LIST (filtered) ──────
  const {
    tasks: filteredTasks,
    loading: filteredLoading,
  } = useFirestoreTasks(
    selectedTag ? "tag" : selectedContext ? "context" : "active",
    selectedTag || selectedContext || undefined
  );

  // ────── ALL TASKS (for filter dropdowns) ──────
  const { tasks: allTasks, loading: allLoading } = useFirestoreTasks();

  // ────── FILTER VALUES ──────
  const contexts = allTasks
    ? Array.from(
        new Set(
          allTasks
            .map((t) => t.context)
            .filter((c): c is string => c !== null && c !== undefined)
        )
      )
    : [];

  const tags = allTasks
    ? Array.from(
        new Set(
          allTasks
            .flatMap((t) => t.tags || [])
            .filter((tag): tag is string => tag !== null && tag !== undefined)
        )
      )
    : [];

  // ────── FILTER HANDLERS ──────
  const handleContextSelect = (context: string | null) => {
    setSelectedContext(context);
    if (selectedTag) setSelectedTag(null);
  };
  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    if (selectedContext) setSelectedContext(null);
  };

  // ────── LOADING SKELETON ──────
  if (filteredLoading || allLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
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

  return (
    <>
      {/* TASK LIST */}
      <TaskList tasks={filteredTasks} />

      {/* FILTERS */}
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

      {/* FAB */}
      <div className="fixed right-4 bottom-40 z-20">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsNewTaskModalOpen(true)}
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* MODAL */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onTaskAdded={() => {
          // Firestore updates in real time — no need to refetch
          toast({ title: "Success", description: "Task added!" });
        }}
      />
    </>
  );
}
