// client/src/pages/Home.tsx
import { useState } from "react";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";
import NewTaskModal from "@/components/NewTaskModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const { tasks, loading, refetch } = useFirestoreTasks("active");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">Home</h1>
        <Button size="icon" variant="ghost" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-gray-500">No active tasks</p>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>

      {/* FAB */}
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <NewTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTaskAdded={() => setModalOpen(false)}
      />
    </div>
  );
}
