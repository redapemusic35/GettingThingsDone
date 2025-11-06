// client/src/pages/Projects.tsx
import { useState } from "react";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";

export default function Projects() {
  const [selected, setSelected] = useState<string | null>(null);
  const { tasks: all } = useFirestoreTasks();
  const { tasks, loading } = useFirestoreTasks("project", selected || undefined);

  const projects = Array.from(new Set(all.map(t => t.project).filter(Boolean)));

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelected(null)}
          className={`px-3 py-1 rounded ${!selected ? "bg-primary text-white" : "bg-gray-200"}`}
        >
          All
        </button>
        {projects.map(p => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={`px-3 py-1 rounded ${selected === p ? "bg-primary text-white" : "bg-gray-200"}`}
          >
            {p}
          </button>
        ))}
      </div>
      {loading ? <div>Loading...</div> : <TaskList tasks={tasks} />}
    </div>
  );
}
