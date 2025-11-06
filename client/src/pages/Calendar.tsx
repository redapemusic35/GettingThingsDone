// client/src/pages/Calendar.tsx
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";

export default function Calendar() {
  const { tasks, loading } = useFirestoreTasks();

  // Filter only tasks with dueDate
  const datedTasks = tasks.filter((t) => t.dueDate && t.status === "active");

  // Group by date
  const groups = datedTasks.reduce((acc, task) => {
    const date = task.dueDate!;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

  if (loading) return <p className="p-4 text-center text-gray-500">Loading...</p>;
  if (sortedDates.length === 0)
    return <p className="p-4 text-center text-gray-500">No tasks with due dates</p>;

  return (
    <div className="p-4 space-y-6">
      {sortedDates.map((date) => {
        const tasks = groups[date];
        const dateObj = parseISO(date);
        let label = format(dateObj, "EEEE, MMMM d");
        if (isToday(dateObj)) label = "Today – " + format(dateObj, "MMM d");
        if (isTomorrow(dateObj)) label = "Tomorrow – " + format(dateObj, "MMM d");

        return (
          <div key={date} className="space-y-2">
            <h3 className="font-medium text-gray-700">{label}</h3>
            <TaskList tasks={tasks} />
          </div>
        );
      })}
    </div>
  );
}
