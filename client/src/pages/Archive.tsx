// client/src/pages/Archive.tsx
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";

export default function Archive() {
  const { tasks, loading } = useFirestoreTasks("archive");

  return (
    <div className="p-4">
      {loading ? (
        <div>Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No completed tasks</div>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  );
}
