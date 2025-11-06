// client/src/pages/Home.tsx
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";

export default function Home() {
  const { tasks, loading } = useFirestoreTasks("active");

  console.log("Home → tasks:", tasks, "loading:", loading);

  if (loading) return <div>Loading...</div>;
  if (!tasks.length) return <div>No active tasks</div>;

  return <TaskList tasks={tasks} />;
}
