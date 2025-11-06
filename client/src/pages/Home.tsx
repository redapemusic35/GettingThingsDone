// client/src/pages/Home.tsx
import { useState, useEffect } from "react";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";
import NewTaskModal from "@/components/NewTaskModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { auth } from "../firebase";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [userUid, setUserUid] = useState<string | null>(null);

  // Re-render when user logs in/out
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth changed → UID:", user?.uid || "none");
      setUserUid(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  const { tasks, loading } = useFirestoreTasks("active");

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
