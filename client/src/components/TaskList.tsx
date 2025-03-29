import { useState } from "react";
import { Task } from "@shared/schema";
import TaskItem from "@/components/TaskItem";
import TaskDetailModal from "@/components/TaskDetailModal";

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleCloseModal = () => {
    setSelectedTask(null);
  };
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 mb-40">
        <p className="text-gray-500">No tasks found. Add a new task to get started.</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-3 mb-40">
        {tasks.map((task) => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onClick={() => handleTaskClick(task)} 
          />
        ))}
      </div>
      
      {selectedTask && (
        <TaskDetailModal 
          isOpen={!!selectedTask} 
          task={selectedTask} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
}
