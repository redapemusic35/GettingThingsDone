// client/src/pages/Calendar.tsx
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFirestoreTasks } from "@/hooks/useFirestoreTasks";
import TaskList from "@/components/TaskList";
import { Button } from "@/components/ui/button";

export default function Calendar() {
  const { tasks } = useFirestoreTasks(); // all tasks
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group tasks by dueDate (only active ones)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks
      .filter((t) => t.dueDate && t.status === "active")
      .forEach((task) => {
        const dateKey = task.dueDate!;
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(task);
      });
    return map;
  }, [tasks]);

  const goToPrevMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const goToNextMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button size="icon" variant="ghost" onClick={goToPrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button size="icon" variant="ghost" onClick={goToNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-600 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Actual days */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(dateStr) || [];

          return (
            <div
              key={dateStr}
              className="min-h-24 border rounded-lg p-2 bg-white hover:bg-gray-50 transition"
            >
              <div className="text-sm font-medium">{format(day, "d")}</div>
              {dayTasks.length > 0 && (
                <div className="mt-1 space-y-1">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Task List Below (optional) */}
      <div className="mt-8">
        <h3 className="font-medium mb-2">Upcoming Tasks</h3>
        <TaskList tasks={tasks.filter((t) => t.dueDate && t.status === "active")} />
      </div>
    </div>
  );
}
