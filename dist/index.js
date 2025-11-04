// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  constructor() {
    this.tasks = /* @__PURE__ */ new Map();
    this.currentId = 1;
  }
  async getTasks() {
    return Array.from(this.tasks.values());
  }
  async getTask(id) {
    return this.tasks.get(id);
  }
  async createTask(insertTask) {
    const id = this.currentId++;
    const createdAt = /* @__PURE__ */ new Date();
    console.log("=== STORAGE CREATE TASK CALLED ===");
    console.log("createTask called with:", JSON.stringify(insertTask, null, 2));
    let tags = null;
    if (insertTask.tags !== void 0 && insertTask.tags !== null) {
      if (!Array.isArray(insertTask.tags)) {
        console.log("Converting non-array tags to array:", insertTask.tags);
        tags = [String(insertTask.tags)];
      } else {
        console.log("Converting tags array items to strings");
        tags = insertTask.tags.map((tag) => String(tag));
      }
    }
    const task = {
      id,
      createdAt,
      title: insertTask.title,
      context: insertTask.context === null || insertTask.context === void 0 || insertTask.context === "null" ? null : String(insertTask.context),
      project: insertTask.project === null || insertTask.project === void 0 || insertTask.project === "null" ? null : String(insertTask.project),
      tags,
      dueDate: insertTask.dueDate === null || insertTask.dueDate === void 0 || insertTask.dueDate === "null" ? null : String(insertTask.dueDate),
      notes: insertTask.notes === null || insertTask.notes === void 0 || insertTask.notes === "null" ? null : String(insertTask.notes),
      completed: insertTask.completed ?? false
    };
    console.log("Created task object:", JSON.stringify(task, null, 2));
    this.tasks.set(id, task);
    return task;
  }
  async updateTask(id, updateData) {
    const task = this.tasks.get(id);
    if (!task) return void 0;
    const updatedTask = {
      ...task,
      title: updateData.title ?? task.title,
      context: updateData.context === null || updateData.context === "null" ? null : updateData.context !== void 0 ? String(updateData.context) : task.context,
      project: updateData.project === null || updateData.project === "null" ? null : updateData.project !== void 0 ? String(updateData.project) : task.project,
      tags: updateData.tags ?? task.tags,
      dueDate: updateData.dueDate === null || updateData.dueDate === "null" ? null : updateData.dueDate !== void 0 ? String(updateData.dueDate) : task.dueDate,
      notes: updateData.notes === null || updateData.notes === "null" ? null : updateData.notes !== void 0 ? String(updateData.notes) : task.notes,
      completed: updateData.completed !== void 0 ? updateData.completed : task.completed
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  async deleteTask(id) {
    return this.tasks.delete(id);
  }
  async getTasksByContext(context) {
    return Array.from(this.tasks.values()).filter(
      (task) => task.context === context
    );
  }
  async getTasksByTag(tag) {
    return Array.from(this.tasks.values()).filter(
      (task) => task.tags?.includes(tag)
    );
  }
  async getTasksByProject(project) {
    return Array.from(this.tasks.values()).filter(
      (task) => task.project === project
    );
  }
  async getCompletedTasks() {
    return Array.from(this.tasks.values()).filter((task) => task.completed);
  }
  async getActiveTasks() {
    return Array.from(this.tasks.values()).filter((task) => !task.completed);
  }
  async getTasksWithDueDate() {
    return Array.from(this.tasks.values()).filter((task) => task.dueDate);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  context: text("context"),
  project: text("project"),
  tags: text("tags").array(),
  dueDate: text("due_date"),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
var upload = multer({ storage: multer.memoryStorage() });
async function registerRoutes(app2) {
  app2.get("/api/tasks", async (req, res) => {
    try {
      const tasks2 = await storage.getTasks();
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app2.get("/api/tasks/active", async (req, res) => {
    try {
      const tasks2 = await storage.getActiveTasks();
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active tasks" });
    }
  });
  app2.get("/api/tasks/completed", async (req, res) => {
    try {
      const tasks2 = await storage.getCompletedTasks();
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch completed tasks" });
    }
  });
  app2.get("/api/tasks/due", async (req, res) => {
    try {
      const tasks2 = await storage.getTasksWithDueDate();
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks with due dates" });
    }
  });
  app2.get("/api/tasks/test-create", async (req, res) => {
    try {
      const testTask = {
        title: "Test Task From TaskWarrior Import",
        completed: false,
        notes: "This is a test task",
        tags: ["test"],
        context: "test",
        project: "test",
        dueDate: "2023-01-01"
      };
      console.log("Creating test task:", testTask);
      const createdTask = await storage.createTask(testTask);
      console.log("Test task created successfully:", createdTask);
      res.json({
        success: true,
        message: "Test task created successfully",
        task: createdTask
      });
    } catch (error) {
      console.error("Error creating test task:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create test task",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/tasks/context/:context", async (req, res) => {
    try {
      const { context } = req.params;
      const tasks2 = await storage.getTasksByContext(context);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by context" });
    }
  });
  app2.get("/api/tasks/tag/:tag", async (req, res) => {
    try {
      const { tag } = req.params;
      const tasks2 = await storage.getTasksByTag(tag);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by tag" });
    }
  });
  app2.get("/api/tasks/project/:project", async (req, res) => {
    try {
      const { project } = req.params;
      const tasks2 = await storage.getTasksByProject(project);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by project" });
    }
  });
  app2.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  app2.post("/api/tasks", async (req, res) => {
    try {
      const validationResult = insertTaskSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      const newTask = await storage.createTask(validationResult.data);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  app2.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const validationResult = insertTaskSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      const updatedTask = await storage.updateTask(id, validationResult.data);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.put("/api/tasks/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const updatedTask = await storage.updateTask(id, { completed: true });
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete task" });
    }
  });
  app2.put("/api/tasks/:id/restore", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const updatedTask = await storage.updateTask(id, { completed: false });
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to restore task" });
    }
  });
  const upload2 = multer({ storage: multer.memoryStorage() });
  const taskwarriorTaskSchema = z.object({
    uuid: z.string(),
    description: z.string(),
    status: z.string(),
    entry: z.string().optional(),
    modified: z.string().optional(),
    due: z.string().optional(),
    priority: z.string().optional(),
    project: z.string().optional(),
    tags: z.array(z.string()).optional()
    // Additional fields can be added as needed
  });
  app2.get("/api/taskwarrior/import-sample", async (req, res) => {
    try {
      const sampleTask = {
        title: "Sample TaskWarrior Task",
        completed: false,
        notes: "This is a sample task from the direct import test",
        tags: ["test", "sample"],
        context: "home",
        project: "testing",
        dueDate: "2023-01-01"
      };
      console.log("Importing sample task:", sampleTask);
      const newTask = await storage.createTask(sampleTask);
      res.status(200).json({
        message: "Successfully imported 1 sample task",
        importedCount: 1,
        task: newTask
      });
    } catch (error) {
      console.error("Error importing sample task:", error);
      res.status(500).json({
        message: "Failed to import sample task",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  const readTasksFromSqlite = (buffer) => {
    try {
      console.log("Trying to parse as SQLite database");
      const tmpFilePath = path.join(process.cwd(), "temp_taskchampion.sqlite3");
      try {
        fs.writeFileSync(tmpFilePath, buffer, { flag: "w" });
        console.log(`Wrote SQLite buffer (${buffer.length} bytes) to temporary file: ${tmpFilePath}`);
        try {
          console.log("Opening SQLite database file...");
          const db = new Database(tmpFilePath, { readonly: true, verbose: console.log });
          console.log("SQLite database opened successfully");
          const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
          const tableNames = tables.map((t) => t.name);
          console.log("Tables in SQLite database:", tableNames);
          let taskTableName = "";
          const possibleTaskTables = ["tasks", "task", "Tasks", "Task", "TASKS", "TASK", "TaskRC", "taskrc"];
          for (const tableName of possibleTaskTables) {
            if (tableNames.includes(tableName)) {
              taskTableName = tableName;
              console.log(`Found task table: ${taskTableName}`);
              break;
            }
          }
          if (!taskTableName && tableNames.length > 0) {
            for (const tableName of tableNames) {
              if (tableName.toLowerCase().includes("task")) {
                taskTableName = tableName;
                console.log(`Found potential task table with fuzzy match: ${taskTableName}`);
                break;
              }
            }
          }
          if (!taskTableName) {
            console.log("Not a TaskChampion database: missing tasks table");
            for (const tableName of tableNames) {
              try {
                const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
                console.log(`Table ${tableName} has columns:`, tableInfo.map((c) => c.name));
                const columnNames = tableInfo.map((c) => c.name.toLowerCase());
                if (columnNames.includes("title") || columnNames.includes("description") || columnNames.includes("completed") || columnNames.includes("status")) {
                  taskTableName = tableName;
                  console.log(`Found potential task table by column names: ${taskTableName}`);
                  break;
                }
              } catch (e) {
                console.log(`Error getting columns for table ${tableName}:`, e);
              }
            }
          }
          if (!taskTableName) {
            console.log("No suitable task table found in the database");
            return [];
          }
          let tasks2 = [];
          try {
            let sampleRow;
            try {
              sampleRow = db.prepare(`SELECT * FROM ${taskTableName} LIMIT 1`).get();
              if (sampleRow) {
                console.log(`Sample row from ${taskTableName}:`, JSON.stringify(sampleRow));
                console.log(`Columns in ${taskTableName}:`, Object.keys(sampleRow));
              }
            } catch (e) {
              console.log(`Error getting sample row from ${taskTableName}:`, e);
            }
            const stmt = db.prepare(`SELECT * FROM ${taskTableName}`);
            tasks2 = stmt.all();
            console.log(`Found ${tasks2.length} tasks in TaskChampion database`);
            if (tasks2.length === 0) {
              return [];
            }
            const availableColumns = sampleRow ? Object.keys(sampleRow).map((k) => k.toLowerCase()) : Object.keys(tasks2[0]).map((k) => k.toLowerCase());
            console.log("Available columns (lowercase):", availableColumns);
            const hasTaskChampionFormat = availableColumns.includes("uuid") && availableColumns.includes("data");
            if (hasTaskChampionFormat) {
              console.log("Detected TaskChampion format with uuid and data columns");
              tasks2 = tasks2.map((task) => {
                try {
                  if (task.data && typeof task.data === "string") {
                    const taskData = JSON.parse(task.data);
                    taskData.uuid = task.uuid;
                    return taskData;
                  }
                } catch (e) {
                  console.log("Error parsing task data JSON:", e);
                }
                return task;
              });
              if (tasks2.length > 0) {
                console.log("First processed TaskChampion task:", JSON.stringify(tasks2[0]));
              }
            }
            console.log("Sample task data:", JSON.stringify(tasks2[0], null, 2));
            return tasks2.map((task) => {
              const taskLower = {};
              for (const key in task) {
                taskLower[key.toLowerCase()] = task[key];
              }
              console.log("Task with lowercase keys:", JSON.stringify(taskLower, null, 2));
              console.log("Looking for description field in:", Object.keys(taskLower));
              let taskDescription = "Untitled Task";
              if (taskLower.description) {
                taskDescription = taskLower.description;
              } else if (taskLower.title) {
                taskDescription = taskLower.title;
              } else if (taskLower.summary) {
                taskDescription = taskLower.summary;
              } else if (taskLower.name) {
                taskDescription = taskLower.name;
              } else if (taskLower.text) {
                taskDescription = taskLower.text;
              } else if (taskLower.task) {
                taskDescription = taskLower.task;
              }
              let status = "pending";
              if (taskLower.status) {
                status = taskLower.status;
              } else if (taskLower.completed === 1 || taskLower.completed === true) {
                status = "completed";
              } else if (taskLower.done === 1 || taskLower.done === true) {
                status = "completed";
              }
              console.log("Found description:", taskDescription, "and status:", status);
              const mappedTask = {
                description: taskDescription,
                status
              };
              const contextMatch = mappedTask.description.match(/@(\w+)/);
              if (contextMatch && contextMatch[1]) {
                mappedTask.annotations = [`@${contextMatch[1]}`];
              }
              const projectMatch = mappedTask.description.match(/\bpro:(\w+)/i);
              if (projectMatch && projectMatch[1]) {
                mappedTask.project = projectMatch[1];
              }
              const tagMatches = mappedTask.description.match(/\+(\w+)/g);
              if (tagMatches && tagMatches.length > 0) {
                mappedTask.tags = tagMatches.map((tag) => tag.substring(1));
              }
              const dueDateMatch = mappedTask.description.match(/\bdue:(\d{4}-\d{2}-\d{2})/i);
              if (dueDateMatch && dueDateMatch[1]) {
                try {
                  const dueDate = new Date(dueDateMatch[1]);
                  mappedTask.due = dueDate.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
                } catch (e) {
                  console.log("Invalid due date format:", dueDateMatch[1]);
                }
              }
              const annotationFields = [];
              for (const key in taskLower) {
                if (key.startsWith("annotation_")) {
                  annotationFields.push(taskLower[key]);
                }
              }
              if (annotationFields.length > 0) {
                mappedTask.annotations = annotationFields;
                mappedTask.annotationTexts = annotationFields.join("\n");
              }
              if (taskLower.uuid) {
                mappedTask.uuid = taskLower.uuid;
              }
              if (taskLower.due) mappedTask.due = taskLower.due;
              if (taskLower.project) mappedTask.project = taskLower.project;
              if (taskLower.project && typeof taskLower.project === "string" && taskLower.project.includes(".")) {
                const projectParts = taskLower.project.split(".");
                mappedTask.project = projectParts[0];
                if (!mappedTask.tags) {
                  mappedTask.tags = [];
                }
                for (const part of projectParts) {
                  if (!mappedTask.tags.includes(part)) {
                    mappedTask.tags.push(part);
                  }
                }
              }
              if (taskLower.tags) {
                try {
                  if (typeof taskLower.tags === "string") {
                    try {
                      mappedTask.tags = JSON.parse(taskLower.tags);
                    } catch {
                      mappedTask.tags = taskLower.tags.split(",").map((t) => t.trim());
                    }
                  } else if (Array.isArray(taskLower.tags)) {
                    mappedTask.tags = taskLower.tags;
                  }
                } catch (e) {
                  console.log("Error processing tags:", e);
                }
              }
              for (const key in taskLower) {
                if (key.startsWith("tags_")) {
                  const tagName = key.substring(5);
                  if (!mappedTask.tags) {
                    mappedTask.tags = [];
                  } else if (!Array.isArray(mappedTask.tags)) {
                    mappedTask.tags = [mappedTask.tags];
                  }
                  if (!mappedTask.tags.includes(tagName)) {
                    mappedTask.tags.push(tagName);
                  }
                  if (tagName.startsWith("@") && !mappedTask.annotations) {
                    mappedTask.annotations = [tagName];
                  }
                }
              }
              return mappedTask;
            });
          } catch (err) {
            console.error("Error querying tasks from SQLite database:", err);
            return [];
          } finally {
            try {
              db.close();
              console.log("SQLite database closed");
            } catch (e) {
              console.log("Error closing SQLite database:", e);
            }
          }
        } catch (dbError) {
          console.error("Error opening SQLite database:", dbError);
          return [];
        }
      } finally {
        try {
          if (fs.existsSync(tmpFilePath)) {
            fs.unlinkSync(tmpFilePath);
            console.log("Temporary SQLite file cleaned up");
          }
        } catch (cleanupError) {
          console.log("Error cleaning up temporary file:", cleanupError);
        }
      }
    } catch (err) {
      console.error("Error processing SQLite file:", err);
      return [];
    }
  };
  app2.post("/api/taskwarrior/import", upload2.single("file"), async (req, res) => {
    console.log("=== TASKWARRIOR IMPORT ENDPOINT CALLED ===");
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const isSqliteFile = req.file.buffer.length >= 16 && (req.file.buffer.slice(0, 16).toString("utf8").includes("SQLite") || req.file.buffer.slice(0, 16).toString("binary").includes("SQLite") || req.file.originalname.toLowerCase().endsWith(".sqlite") || req.file.originalname.toLowerCase().endsWith(".sqlite3") || req.file.originalname.toLowerCase().endsWith(".db"));
      console.log("File type detection:", isSqliteFile ? "SQLite database" : "Possibly JSON");
      let taskwarriorTasks = [];
      if (isSqliteFile) {
        taskwarriorTasks = readTasksFromSqlite(req.file.buffer);
        if (taskwarriorTasks.length === 0) {
          return res.status(400).json({
            message: "No tasks found in the SQLite database or not a valid TaskChampion database file"
          });
        }
      } else {
        const fileContent = req.file.buffer.toString();
        console.log("Raw file content:", fileContent.substring(0, 200) + "...");
        try {
          let parseSuccess = false;
          try {
            console.log("Trying to parse as single JSON object");
            const singleTask = JSON.parse(fileContent.trim());
            console.log("Single task parse result:", JSON.stringify(singleTask).substring(0, 100));
            if (singleTask && typeof singleTask === "object") {
              taskwarriorTasks = [singleTask];
              parseSuccess = true;
              console.log("Successfully parsed as single task object");
            }
          } catch (err) {
            console.log("Single task parse failed:", err instanceof Error ? err.message : String(err));
            try {
              console.log("Trying to parse as multiple JSON objects per line");
              const lines = fileContent.trim().split("\n");
              console.log("Split into", lines.length, "lines");
              taskwarriorTasks = lines.map((line) => JSON.parse(line));
              parseSuccess = true;
              console.log("Successfully parsed as multi-line JSON");
            } catch (err2) {
              console.log("Multi-line parse failed:", err2 instanceof Error ? err2.message : String(err2));
            }
          }
          if (!parseSuccess) {
            try {
              console.log("Trying to parse as JSON array");
              const tasksArray = JSON.parse(`[${fileContent.trim()}]`);
              if (Array.isArray(tasksArray) && tasksArray.length > 0) {
                taskwarriorTasks = tasksArray;
                parseSuccess = true;
                console.log("Successfully parsed as JSON array");
              }
            } catch (err) {
              console.log("Array parse failed:", err instanceof Error ? err.message : String(err));
            }
          }
          if (!parseSuccess) {
            try {
              console.log("Trying to extract JSON objects with regex");
              const jsonRegex = /{[^}]*}/g;
              const matches = fileContent.match(jsonRegex);
              if (matches && matches.length > 0) {
                console.log(`Found ${matches.length} potential JSON objects with regex`);
                const validTasks = [];
                for (const match of matches) {
                  try {
                    const task = JSON.parse(match);
                    if (task && typeof task === "object" && task.description) {
                      validTasks.push(task);
                    }
                  } catch (e) {
                  }
                }
                if (validTasks.length > 0) {
                  taskwarriorTasks = validTasks;
                  parseSuccess = true;
                  console.log(`Successfully extracted ${validTasks.length} valid tasks with regex`);
                }
              }
            } catch (err) {
              console.log("Regex extraction failed:", err instanceof Error ? err.message : String(err));
            }
          }
          if (!parseSuccess || !taskwarriorTasks || taskwarriorTasks.length === 0) {
            throw new Error("No valid tasks found in the file");
          }
          console.log(`Successfully parsed ${taskwarriorTasks.length} tasks`);
        } catch (error) {
          console.error("TaskWarrior parse error:", error);
          return res.status(400).json({
            message: "Invalid TaskWarrior JSON format",
            details: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      const importedTasks = [];
      let skippedCount = 0;
      if (taskwarriorTasks.length > 0) {
        console.log("First task properties:", Object.keys(taskwarriorTasks[0]));
      }
      for (const twTask of taskwarriorTasks) {
        try {
          if (!twTask.description) {
            console.log("Skipping task without description:", twTask);
            skippedCount++;
            continue;
          }
          console.log("Processing task:", twTask.description);
          let title = twTask.description || "Untitled Task";
          let context = null;
          let project = null;
          let dueDate = null;
          let tags = [];
          const contextMatch = title.match(/@(\w+)/);
          if (contextMatch && contextMatch[1]) {
            context = contextMatch[1];
            title = title.replace(contextMatch[0], "").trim();
          }
          const projectMatch = title.match(/\bpro:(\w+)/i);
          if (projectMatch && projectMatch[1]) {
            project = projectMatch[1];
            title = title.replace(projectMatch[0], "").trim();
          }
          const tagMatches = title.match(/\+(\w+)/g);
          if (tagMatches && tagMatches.length > 0) {
            tags = tagMatches.map((tag) => tag.substring(1));
            tagMatches.forEach((tag) => {
              title = title.replace(tag, "").trim();
            });
          }
          const dueDateMatch = title.match(/\bdue:(\d{4}-\d{2}-\d{2})/i);
          if (dueDateMatch && dueDateMatch[1]) {
            dueDate = dueDateMatch[1];
            title = title.replace(dueDateMatch[0], "").trim();
          }
          const insertTask = {
            // Required fields
            title,
            completed: twTask.status === "completed" || twTask.status === "done" || twTask.status === "deleted" || twTask.end !== void 0 || twTask.status === "completed",
            notes: "",
            // Optional fields
            tags,
            project,
            context,
            dueDate
          };
          if (twTask.tags) {
            console.log("Raw tags from TaskWarrior task:", twTask.tags);
            insertTask.tags = Array.isArray(twTask.tags) ? twTask.tags : [String(twTask.tags)];
            console.log("Processed tags:", insertTask.tags);
          }
          if (twTask.project) {
            insertTask.project = twTask.project;
          }
          if (twTask.annotations) {
            if (typeof twTask.annotations === "string") {
              const contextMatch2 = twTask.annotations.match(/@(\w+)/);
              if (contextMatch2 && contextMatch2[1]) {
                insertTask.context = contextMatch2[1];
              }
            } else if (Array.isArray(twTask.annotations)) {
              for (const annotation of twTask.annotations) {
                if (annotation && typeof annotation.value === "string") {
                  const contextMatch2 = annotation.value.match(/@(\w+)/);
                  if (contextMatch2 && contextMatch2[1]) {
                    insertTask.context = contextMatch2[1];
                    break;
                  }
                  const plusContextMatch = annotation.value.match(/\+@(\w+)/);
                  if (plusContextMatch && plusContextMatch[1]) {
                    insertTask.context = plusContextMatch[1];
                    break;
                  }
                }
              }
            }
          }
          if (!insertTask.context && Array.isArray(insertTask.tags)) {
            for (const tag of insertTask.tags) {
              if (typeof tag === "string" && tag.startsWith("@")) {
                insertTask.context = tag.substring(1);
                break;
              }
            }
          }
          if (twTask.due) {
            try {
              const dueDate2 = new Date(twTask.due);
              insertTask.dueDate = dueDate2.toISOString().split("T")[0];
            } catch (e) {
              console.log("Invalid due date format:", twTask.due);
            }
          }
          let notes = "";
          if (twTask.uuid) {
            notes += `TaskWarrior ID: ${twTask.uuid}
`;
          } else if (twTask.id !== void 0) {
            notes += `TaskWarrior ID: ${twTask.id}
`;
          }
          if (twTask.priority) {
            notes += `Priority: ${twTask.priority}
`;
          }
          const metadataFields = ["entry", "modified", "imask", "parent"];
          for (const field of metadataFields) {
            if (twTask[field] !== void 0) {
              notes += `${field}: ${twTask[field]}
`;
            }
          }
          for (const key in twTask) {
            if (key.startsWith("annotation_") && twTask[key]) {
              notes += `${twTask[key]}

`;
            }
          }
          insertTask.notes = notes;
          console.log("Parsed insert task:", JSON.stringify(insertTask));
          for (const key in twTask) {
            if (key.startsWith("tags_")) {
              const tagName = key.substring(5);
              if (!insertTask.tags.includes(tagName)) {
                insertTask.tags.push(tagName);
              }
              if (tagName.startsWith("@") && !insertTask.context) {
                insertTask.context = tagName.substring(1);
              }
            }
          }
          console.log("Raw insert task before validation:", insertTask);
          try {
            if (insertTask.tags && !Array.isArray(insertTask.tags)) {
              insertTask.tags = [];
            }
            try {
              const taskData = {
                title: String(insertTask.title || "Untitled Task"),
                completed: Boolean(insertTask.completed),
                notes: String(insertTask.notes || ""),
                context: insertTask.context ? String(insertTask.context) : null,
                project: insertTask.project ? String(insertTask.project) : null,
                dueDate: insertTask.dueDate ? String(insertTask.dueDate) : null,
                tags: (() => {
                  if (!insertTask.tags) return [];
                  if (!Array.isArray(insertTask.tags)) return [String(insertTask.tags)];
                  return insertTask.tags.map((tag) => String(tag || "")).filter((tag) => tag.length > 0);
                })()
              };
              console.log("Formatted task data:", taskData);
              console.log("About to call storage.createTask with:", JSON.stringify(taskData, null, 2));
              try {
                const newTask = await storage.createTask(taskData);
                console.log("Successfully created task:", newTask.id);
                importedTasks.push(newTask);
              } catch (creationError) {
                console.error("ERROR CREATING TASK:", creationError);
                throw creationError;
              }
            } catch (error) {
              console.log("Storage insertion error:", error);
              try {
                const minimalTask = {
                  title: String(insertTask.title || "Untitled TaskWarrior Task"),
                  completed: Boolean(insertTask.completed),
                  notes: String(insertTask.notes || ""),
                  tags: []
                };
                console.log("Using minimal fallback task:", minimalTask);
                const newTask = await storage.createTask(minimalTask);
                importedTasks.push(newTask);
              } catch (fallbackError) {
                console.log("Even fallback insertion failed:", fallbackError);
                skippedCount++;
              }
            }
          } catch (err) {
            console.log("Error during validation/insertion:", err);
            skippedCount++;
          }
        } catch (error) {
          console.log("Error processing task:", error);
          skippedCount++;
        }
      }
      res.status(200).json({
        message: `Imported ${importedTasks.length} tasks. Skipped ${skippedCount} tasks.`,
        importedCount: importedTasks.length,
        skippedCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import TaskWarrior data" });
    }
  });
  app2.get("/api/taskwarrior/export", async (req, res) => {
    try {
      const tasks2 = await storage.getTasks();
      const taskwarriorTasks = tasks2.map((task) => {
        let uuid = "";
        const uuidMatch = task.notes?.match(/TaskWarrior ID: ([a-f0-9-]+)/i);
        if (uuidMatch && uuidMatch[1]) {
          uuid = uuidMatch[1];
        } else {
          uuid = "tw-" + Date.now() + "-" + Math.floor(Math.random() * 1e4);
        }
        const now = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
        let description = task.title;
        if (task.tags && task.tags.length > 0) {
          task.tags.forEach((tag) => {
            description += ` +${tag}`;
          });
        }
        if (task.context) {
          description += ` +@${task.context}`;
        }
        if (task.project) {
          description += ` pro:${task.project}`;
        }
        if (task.dueDate) {
          description += ` due:${task.dueDate}`;
        }
        const twTask = {
          uuid,
          description,
          status: task.completed ? "completed" : "pending",
          entry: now,
          modified: now
        };
        if (task.context) {
          twTask.annotations = [`+@${task.context}`];
        }
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          twTask.due = dueDate.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
        }
        if (task.project) {
          twTask.project = task.project;
        }
        if (task.tags && task.tags.length > 0) {
          twTask.tags = task.tags;
        }
        if (task.notes) {
          const priorityMatch = task.notes.match(/Priority: ([HML])/);
          if (priorityMatch && priorityMatch[1]) {
            twTask.priority = priorityMatch[1];
          }
        }
        return twTask;
      });
      const output = taskwarriorTasks.map((task) => JSON.stringify(task)).join("\n");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", 'attachment; filename="taskwarrior-export.json"');
      res.send(output);
    } catch (error) {
      res.status(500).json({ message: "Failed to export tasks" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
