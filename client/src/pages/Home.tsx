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

  console.log("Home render →", { loading, taskCount: tasks.length });

  return (
    <>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No active tasks</div>
      ) : (
        <TaskList tasks={tasks} />
      )}

      <div className="fixed right-6 bottom-6 z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary"
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
    </>
  );
}
