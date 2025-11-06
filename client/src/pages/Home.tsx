// client/src/pages/Home.tsx
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";

export default function Home() {
  const { tasks, loading } = useFirestoreTasks("active");

  console.log("Home → tasks:", tasks, "loading:", loading);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!tasks.length) return <div className="p-4 text-center text-gray-500">No active tasks</div>;

  return <TaskList tasks={tasks} />;
}
