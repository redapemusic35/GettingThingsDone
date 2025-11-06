// client/src/components/TaskList.tsx
import { completeTask } from "@/hooks/useFirestoreTasks";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Task } from "@shared/schema";

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const active = tasks.filter((t) => t.status === "active");
  console.log("TaskList → active:", active);

  if (!active.length) return <p>No active tasks</p>;

  return (
    <div className="space-y-2">
      {active.map((t) => (
        <div key={t.id} className="flex justify-between items-center p-2 border">
          <span>{t.title}</span>
          <Button size="icon" onClick={() => completeTask(t.id)}>
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
