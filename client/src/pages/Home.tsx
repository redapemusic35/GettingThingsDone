// client/src/pages/Home.tsx
import { useState } from "react";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";
import NewTaskModal from "@/components/NewTaskModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const { tasks, loading } = useFirestoreTasks("active");

  console.log("Home → tasks:", tasks, "loading:", loading);

  return (
    <>
      {/* Task List */}
      {loading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No active tasks</div>
      ) : (
        <TaskList tasks={tasks} />
      )}

      {/* Floating + Button */}
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Modal */}
      <NewTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTaskAdded={() => setModalOpen(false)}
      />
    </>
  );
}
