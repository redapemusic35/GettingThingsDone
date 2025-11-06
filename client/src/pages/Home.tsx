// client/src/pages/Home.tsx
import { useState, useEffect } from "react";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";
import NewTaskModal from "@/components/NewTaskModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { auth } from "../firebase";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const { tasks, loading, refetch } = useFirestoreTasks("active");

  // Re‑fetch on login
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User logged in → refetching tasks");
        refetch();
      }
    });
    return unsub;
  }, [refetch]);

  return (
    <>
      {/* Pull‑to‑refresh button */}
      <div className="flex justify-end p-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={refetch}
          disabled={loading}
          className="animate-spin-if-loading"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No active tasks</div>
      ) : (
        <TaskList tasks={tasks} />
      )}

      {/* FAB */}
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
