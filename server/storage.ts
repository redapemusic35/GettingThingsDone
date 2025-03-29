import { tasks, type Task, type InsertTask } from "@shared/schema";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByContext(context: string): Promise<Task[]>;
  getTasksByTag(tag: string): Promise<Task[]>;
  getTasksByProject(project: string): Promise<Task[]>;
  getCompletedTasks(): Promise<Task[]>;
  getActiveTasks(): Promise<Task[]>;
  getTasksWithDueDate(): Promise<Task[]>;
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private currentId: number;

  constructor() {
    this.tasks = new Map();
    this.currentId = 1;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const createdAt = new Date();
    
    // Log detail about the attempted task creation
    console.log("=== STORAGE CREATE TASK CALLED ===");
    console.log("createTask called with:", JSON.stringify(insertTask, null, 2));
    
    // Fix tags format - ensure it's always an array of strings or null
    let tags = null;
    if (insertTask.tags !== undefined && insertTask.tags !== null) {
      // If somehow tags is a primitive like string, put it in an array
      if (!Array.isArray(insertTask.tags)) {
        console.log("Converting non-array tags to array:", insertTask.tags);
        tags = [String(insertTask.tags)];
      } else {
        // Ensure all array items are strings (required by schema)
        console.log("Converting tags array items to strings");
        tags = insertTask.tags.map(tag => String(tag));
      }
    }
    
    // Ensure all nullable fields are properly set to null rather than undefined
    const task: Task = {
      id,
      createdAt,
      title: insertTask.title,
      context: insertTask.context === null || insertTask.context === undefined || insertTask.context === "null" 
        ? null 
        : String(insertTask.context),
      project: insertTask.project === null || insertTask.project === undefined || insertTask.project === "null" 
        ? null 
        : String(insertTask.project),
      tags: tags,
      dueDate: insertTask.dueDate === null || insertTask.dueDate === undefined || insertTask.dueDate === "null" 
        ? null 
        : String(insertTask.dueDate),
      notes: insertTask.notes === null || insertTask.notes === undefined || insertTask.notes === "null" 
        ? null
        : String(insertTask.notes),
      completed: insertTask.completed ?? false
    };
    
    console.log("Created task object:", JSON.stringify(task, null, 2));
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    // Create a properly typed updated task
    const updatedTask: Task = {
      ...task,
      title: updateData.title ?? task.title,
      context: updateData.context === null || updateData.context === "null" 
        ? null 
        : (updateData.context !== undefined ? String(updateData.context) : task.context),
      project: updateData.project === null || updateData.project === "null" 
        ? null 
        : (updateData.project !== undefined ? String(updateData.project) : task.project),
      tags: updateData.tags ?? task.tags,
      dueDate: updateData.dueDate === null || updateData.dueDate === "null" 
        ? null 
        : (updateData.dueDate !== undefined ? String(updateData.dueDate) : task.dueDate),
      notes: updateData.notes === null || updateData.notes === "null" 
        ? null 
        : (updateData.notes !== undefined ? String(updateData.notes) : task.notes),
      completed: updateData.completed !== undefined ? updateData.completed : task.completed
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByContext(context: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.context === context
    );
  }

  async getTasksByTag(tag: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) =>
      task.tags?.includes(tag)
    );
  }

  async getTasksByProject(project: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.project === project
    );
  }

  async getCompletedTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) => task.completed);
  }

  async getActiveTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) => !task.completed);
  }

  async getTasksWithDueDate(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) => task.dueDate);
  }
}

export const storage = new MemStorage();
