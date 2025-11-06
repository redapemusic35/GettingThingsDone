// client/src/pages/Archive.tsx
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";

export default function Archive() {
  const { tasks, loading } = useFirestoreTasks("archive");

  if (loading) return <p className="p-4 text-center text-gray-500">Loading...</p>;
  if (tasks.length === 0)
    return <p className="p-4 text-center text-gray-500">No completed tasks</p>;

  return (
    <div className="p-4">
      <TaskList tasks={tasks} />
    </div>
  );
}
