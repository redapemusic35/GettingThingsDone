// client/src/pages/Calendar.tsx
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isValid } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestoreTasks, completeTask } from "@/hooks/useFirestoreTasks";
import { Task } from "@shared/schema";
import { Timestamp } from "firebase/firestore";

export default function Calendar() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  // ────── ALL TASKS WITH DUE DATES (real‑time) ──────
  const { tasks: tasksWithDueDate, loading } = useFirestoreTasks();

  // ────── HELPER: Convert Firestore Timestamp → JS Date ──────
  const toDate = (due: any): Date | null => {
    if (!due) return null;
    if (due instanceof Timestamp) return due.toDate();
    if (typeof due === "string") {
      const d = parseISO(due);
      return isValid(d) ? d : null;
    }
    return null;
  };

  // ────── TASKS FOR SELECTED DAY ──────
  const tasksForSelectedDay = selectedDay
    ? tasksWithDueDate.filter((task) => {
        const taskDate = toDate(task.dueDate);
        if (!taskDate) return false;
        return (
          taskDate.getDate() === selectedDay.getDate() &&
          taskDate.getMonth() === selectedDay.getMonth() &&
          taskDate.getFullYear() === selectedDay.getFullYear()
        );
      })
    : [];

  // ────── DAY HAS TASKS? ──────
  const dayHasTasks = (day: Date) =>
    tasksWithDueDate.some((task) => {
      const taskDate = toDate(task.dueDate);
      if (!taskDate) return false;
      return (
        taskDate.getDate() === day.getDate() &&
        taskDate.getMonth() === day.getMonth() &&
        taskDate.getFullYear() === day.getFullYear()
      );
    });

  // ────── DATES WITH TASKS (for calendar dots) ──────
  const datesWithTasks = tasksWithDueDate
    .map((task) => toDate(task.dueDate))
    .filter((d): d is Date => d !== null);

  // ────── COMPLETE TASK (Firestore) ──────
  const handleComplete = async (id: string) => {
    try {
      await completeTask(id);
      toast({
        title: "Task completed",
        description: "Marked as completed.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // ────── LOADING ──────
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading calendar...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ────── CALENDAR CARD ────── */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex items-center justify-between w-full">
            <CardTitle>{format(date, "MMMM yyyy")}</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(date);
                  newDate.setMonth(date.getMonth() - 1);
                  setDate(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(date);
                  newDate.setMonth(date.getMonth() + 1);
                  setDate(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            month={date}
            onMonthChange={setDate}
            className="rounded-md border"
            modifiersStyles={{
              selected: {
                backgroundColor: "hsl(var(--primary))",
                color: "white",
              },
            }}
            modifiers={{
              hasTasks: datesWithTasks,
            }}
            modifiersClassNames={{
              hasTasks:
                "font-bold relative before:absolute before:bottom-0.5 before:left-1/2 before:-translate-x-1/2 before:w-1 before:h-1 before:bg-primary before:rounded-full",
            }}
          />
        </CardContent>
      </Card>

      {/* ────── TASKS FOR SELECTED DAY ────── */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tasks Due on {format(selectedDay, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksForSelectedDay.length > 0 ? (
              <div className="space-y-3">
                {tasksForSelectedDay.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-md p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.context && `@${task.context}`}{" "}
                          {task.tags?.map((tag) => `+${tag}`).join(" ")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleComplete(task.id)}
                      >
                        <CheckCircle className="h-5 w-5 text-gray-400 hover:text-green-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No tasks due on this day.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
