import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isValid } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  const tasksQuery = useQuery<Task[]>({
    queryKey: ['/api/tasks/due'],
  });

  const completeTask = async (id: number) => {
    try {
      await apiRequest('PUT', `/api/tasks/${id}/complete`, {});
      toast({
        title: "Task completed",
        description: "The task has been marked as completed.",
      });
      tasksQuery.refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete the task.",
        variant: "destructive",
      });
    }
  };

  // Get all tasks that have due dates
  const tasksWithDueDate = tasksQuery.data || [];
  
  // Get tasks due on the selected day
  const tasksForSelectedDay = selectedDay ? tasksWithDueDate.filter(task => {
    if (!task.dueDate) return false;
    try {
      const taskDate = parseISO(task.dueDate);
      if (!isValid(taskDate)) return false;
      return taskDate.getDate() === selectedDay.getDate() &&
        taskDate.getMonth() === selectedDay.getMonth() &&
        taskDate.getFullYear() === selectedDay.getFullYear();
    } catch {
      return false;
    }
  }) : [];
  
  // Function to determine if a day has tasks
  const dayHasTasks = (day: Date) => {
    return tasksWithDueDate.some(task => {
      if (!task.dueDate) return false;
      try {
        const taskDate = parseISO(task.dueDate);
        if (!isValid(taskDate)) return false;
        return taskDate.getDate() === day.getDate() &&
          taskDate.getMonth() === day.getMonth() &&
          taskDate.getFullYear() === day.getFullYear();
      } catch {
        return false;
      }
    });
  };

  // Get array of dates with tasks
  const datesWithTasks = tasksWithDueDate
    .map(task => {
      if (!task.dueDate) return null;
      try {
        const date = parseISO(task.dueDate);
        return isValid(date) ? date : null;
      } catch {
        return null;
      }
    })
    .filter((date): date is Date => date !== null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex items-center justify-between w-full">
            <CardTitle>{format(date, 'MMMM yyyy')}</CardTitle>
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
                color: "white"
              }
            }}
            modifiers={{
              hasTasks: datesWithTasks
            }}
            modifiersClassNames={{
              hasTasks: "font-bold relative before:absolute before:bottom-0.5 before:left-1/2 before:-translate-x-1/2 before:w-1 before:h-1 before:bg-primary before:rounded-full"
            }}
          />
        </CardContent>
      </Card>
      
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tasks Due on {format(selectedDay, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksForSelectedDay.length > 0 ? (
              <div className="space-y-3">
                {tasksForSelectedDay.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.context && `@${task.context}`} {task.tags?.map(tag => `+${tag}`).join(' ')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => completeTask(task.id)}
                      >
                        <CheckCircle className="h-5 w-5 text-gray-400 hover:text-green-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tasks due on this day.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
