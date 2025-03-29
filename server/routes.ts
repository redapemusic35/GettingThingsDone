import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

// Configure multer storage in memory
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Tasks API endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/active", async (req, res) => {
    try {
      const tasks = await storage.getActiveTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active tasks" });
    }
  });

  app.get("/api/tasks/completed", async (req, res) => {
    try {
      const tasks = await storage.getCompletedTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch completed tasks" });
    }
  });

  app.get("/api/tasks/due", async (req, res) => {
    try {
      const tasks = await storage.getTasksWithDueDate();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks with due dates" });
    }
  });
  
  // Test route to create a simple task directly (for debugging)
  app.get("/api/tasks/test-create", async (req, res) => {
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

  app.get("/api/tasks/context/:context", async (req, res) => {
    try {
      const { context } = req.params;
      const tasks = await storage.getTasksByContext(context);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by context" });
    }
  });

  app.get("/api/tasks/tag/:tag", async (req, res) => {
    try {
      const { tag } = req.params;
      const tasks = await storage.getTasksByTag(tag);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by tag" });
    }
  });

  app.get("/api/tasks/project/:project", async (req, res) => {
    try {
      const { project } = req.params;
      const tasks = await storage.getTasksByProject(project);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by project" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
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

  app.post("/api/tasks", async (req, res) => {
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

  app.put("/api/tasks/:id", async (req, res) => {
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

  app.delete("/api/tasks/:id", async (req, res) => {
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

  // Complete a task (mark as archived)
  app.put("/api/tasks/:id/complete", async (req, res) => {
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

  // Restore a completed task
  app.put("/api/tasks/:id/restore", async (req, res) => {
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

  // TaskWarrior integration
  const upload = multer({ storage: multer.memoryStorage() });
  
  // Define a schema for TaskWarrior tasks
  const taskwarriorTaskSchema = z.object({
    uuid: z.string(),
    description: z.string(),
    status: z.string(),
    entry: z.string().optional(),
    modified: z.string().optional(),
    due: z.string().optional(),
    priority: z.string().optional(),
    project: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // Additional fields can be added as needed
  });

  // Special test endpoint to import a guaranteed sample task
  app.get("/api/taskwarrior/import-sample", async (req, res) => {
    try {
      // Create a sample TaskWarrior task
      const sampleTask = {
        title: "Sample TaskWarrior Task",
        completed: false,
        notes: "This is a sample task from the direct import test",
        tags: ["test", "sample"],
        context: "home",
        project: "testing",
        dueDate: "2023-01-01"
      };
      
      // Directly create it
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

  // Function to read tasks from TaskChampion SQLite database
  const readTasksFromSqlite = (buffer: Buffer): any[] => {
    try {
      console.log("Trying to parse as SQLite database");
      // Write the buffer to a temporary file so SQLite can open it
      // Use process.cwd() instead of __dirname for ES modules
      const tmpFilePath = path.join(process.cwd(), 'temp_taskchampion.sqlite3');
      
      try {
        // Make sure we write binary data exactly as is
        fs.writeFileSync(tmpFilePath, buffer, { flag: 'w' });
        console.log(`Wrote SQLite buffer (${buffer.length} bytes) to temporary file: ${tmpFilePath}`);
        
        try {
          // Open the SQLite database with verbose error handling
          console.log("Opening SQLite database file...");
          const db = new Database(tmpFilePath, { readonly: true, verbose: console.log });
          console.log("SQLite database opened successfully");
          
          // Check if it has the right tables for TaskChampion
          const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
          const tableNames = tables.map((t: any) => t.name);
          console.log("Tables in SQLite database:", tableNames);
          
          // Try different possible table names for tasks
          let taskTableName = '';
          const possibleTaskTables = ['tasks', 'task', 'Tasks', 'Task', 'TASKS', 'TASK', 'TaskRC', 'taskrc'];
          
          for (const tableName of possibleTaskTables) {
            if (tableNames.includes(tableName)) {
              taskTableName = tableName;
              console.log(`Found task table: ${taskTableName}`);
              break;
            }
          }
          
          // If we didn't find a table with an exact match, try a fuzzy match
          if (!taskTableName && tableNames.length > 0) {
            for (const tableName of tableNames) {
              if (tableName.toLowerCase().includes('task')) {
                taskTableName = tableName;
                console.log(`Found potential task table with fuzzy match: ${taskTableName}`);
                break;
              }
            }
          }
          
          if (!taskTableName) {
            console.log("Not a TaskChampion database: missing tasks table");
            // Try to see what columns exist in each table
            for (const tableName of tableNames) {
              try {
                const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
                console.log(`Table ${tableName} has columns:`, tableInfo.map((c: any) => c.name));
                
                // If the table has columns that look like task data (title/description/completed)
                const columnNames = tableInfo.map((c: any) => c.name.toLowerCase());
                if (columnNames.includes('title') || columnNames.includes('description') || 
                    columnNames.includes('completed') || columnNames.includes('status')) {
                  taskTableName = tableName;
                  console.log(`Found potential task table by column names: ${taskTableName}`);
                  break;
                }
              } catch (e) {
                console.log(`Error getting columns for table ${tableName}:`, e);
              }
            }
          }
          
          // Still no task table found
          if (!taskTableName) {
            console.log("No suitable task table found in the database");
            return [];
          }
          
          // Query the tasks table
          let tasks: any[] = [];
          
          try {
            // Try to get a single row first to see column names
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
            
            // Get all rows
            const stmt = db.prepare(`SELECT * FROM ${taskTableName}`);
            tasks = stmt.all();
            console.log(`Found ${tasks.length} tasks in TaskChampion database`);
            
            if (tasks.length === 0) {
              return [];
            }
            
            // Determine column names available (lowercase for case-insensitive matching)
            const availableColumns = sampleRow ? 
              Object.keys(sampleRow).map(k => k.toLowerCase()) : 
              Object.keys(tasks[0]).map(k => k.toLowerCase());
            
            console.log("Available columns (lowercase):", availableColumns);
            
            // Special handling for TaskChampion format (uuid + data JSON)
            const hasTaskChampionFormat = availableColumns.includes('uuid') && availableColumns.includes('data');
            
            if (hasTaskChampionFormat) {
              console.log("Detected TaskChampion format with uuid and data columns");
              // Process each task to extract data from JSON
              tasks = tasks.map(task => {
                try {
                  if (task.data && typeof task.data === 'string') {
                    // Parse the JSON data field
                    const taskData = JSON.parse(task.data);
                    // Add UUID to the task data
                    taskData.uuid = task.uuid;
                    return taskData;
                  }
                } catch (e) {
                  console.log("Error parsing task data JSON:", e);
                }
                return task;
              });
              
              // Show first processed task for debugging
              if (tasks.length > 0) {
                console.log("First processed TaskChampion task:", JSON.stringify(tasks[0]));
              }
            }
            
            // Log a complete sample row to debug
            console.log("Sample task data:", JSON.stringify(tasks[0], null, 2));
            
            // Transform the tasks to match the TaskWarrior format
            return tasks.map((task: any) => {
              // Create a lowercase key mapping for easier access
              const taskLower: Record<string, any> = {};
              for (const key in task) {
                taskLower[key.toLowerCase()] = task[key];
              }
              
              console.log("Task with lowercase keys:", JSON.stringify(taskLower, null, 2));
              
              // Basic mapping from TaskChampion to TaskWarrior format
              // Check what fields we have available
              console.log("Looking for description field in:", Object.keys(taskLower));
              
              // Determine the task description field - it could be named differently in different SQLite schemas
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
              
              // Determine status
              let status = "pending";
              if (taskLower.status) {
                status = taskLower.status;
              } else if (taskLower.completed === 1 || taskLower.completed === true) {
                status = "completed";
              } else if (taskLower.done === 1 || taskLower.done === true) {
                status = "completed";
              }
              
              console.log("Found description:", taskDescription, "and status:", status);
              
              const mappedTask: any = {
                description: taskDescription, 
                status: status
              };
              
              // Extract context from @context pattern
              const contextMatch = mappedTask.description.match(/@(\w+)/);
              if (contextMatch && contextMatch[1]) {
                mappedTask.annotations = [`@${contextMatch[1]}`];
              }
              
              // Extract project from pro:project pattern
              const projectMatch = mappedTask.description.match(/\bpro:(\w+)/i);
              if (projectMatch && projectMatch[1]) {
                mappedTask.project = projectMatch[1];
              }
              
              // Extract tags from +tag pattern
              const tagMatches = mappedTask.description.match(/\+(\w+)/g);
              if (tagMatches && tagMatches.length > 0) {
                mappedTask.tags = tagMatches.map((tag: string) => tag.substring(1));
              }
              
              // Extract due date from due:YYYY-MM-DD pattern
              const dueDateMatch = mappedTask.description.match(/\bdue:(\d{4}-\d{2}-\d{2})/i);
              if (dueDateMatch && dueDateMatch[1]) {
                try {
                  // Convert YYYY-MM-DD to TaskWarrior format
                  const dueDate = new Date(dueDateMatch[1]);
                  mappedTask.due = dueDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
                } catch (e) {
                  console.log("Invalid due date format:", dueDateMatch[1]);
                }
              }
              
              // Extract annotation fields from TaskChampion format
              // They typically appear as "annotation_1699962011": "some note text"
              const annotationFields: string[] = [];
              for (const key in taskLower) {
                if (key.startsWith('annotation_')) {
                  annotationFields.push(taskLower[key]);
                }
              }
              
              if (annotationFields.length > 0) {
                mappedTask.annotations = annotationFields;
                // Also add them directly to the mappedTask for debugging
                mappedTask.annotationTexts = annotationFields.join('\n');
              }
              
              // Add UUID if available
              if (taskLower.uuid) {
                mappedTask.uuid = taskLower.uuid;
              }
              
              // Map additional fields if they exist
              if (taskLower.due) mappedTask.due = taskLower.due;
              if (taskLower.project) mappedTask.project = taskLower.project;
              
              // Handle TaskChampion project format which could be in the form "project": "name.subname"
              if (taskLower.project && typeof taskLower.project === 'string' && taskLower.project.includes('.')) {
                // Split on dot and use the first part as the main project
                const projectParts = taskLower.project.split('.');
                mappedTask.project = projectParts[0];
                
                // Add tags for the subprojects
                if (!mappedTask.tags) {
                  mappedTask.tags = [];
                }
                
                // Add all parts as tags
                for (const part of projectParts) {
                  if (!mappedTask.tags.includes(part)) {
                    mappedTask.tags.push(part);
                  }
                }
              }
              
              // Handle tags - they might be stored in different formats
              if (taskLower.tags) {
                try {
                  if (typeof taskLower.tags === 'string') {
                    try {
                      // Try to parse as JSON
                      mappedTask.tags = JSON.parse(taskLower.tags);
                    } catch {
                      // Try to split by comma
                      mappedTask.tags = taskLower.tags.split(',').map((t: string) => t.trim());
                    }
                  } else if (Array.isArray(taskLower.tags)) {
                    mappedTask.tags = taskLower.tags;
                  }
                } catch (e) {
                  console.log("Error processing tags:", e);
                }
              }
              
              // Check for "tags_tag": "x" format that TaskChampion uses
              for (const key in taskLower) {
                if (key.startsWith('tags_')) {
                  // Extract tag name after "tags_"
                  const tagName = key.substring(5);
                  if (!mappedTask.tags) {
                    mappedTask.tags = [];
                  } else if (!Array.isArray(mappedTask.tags)) {
                    mappedTask.tags = [mappedTask.tags];
                  }
                  
                  if (!mappedTask.tags.includes(tagName)) {
                    mappedTask.tags.push(tagName);
                  }
                  
                  // Check if it's a context tag (@context)
                  if (tagName.startsWith('@') && !mappedTask.annotations) {
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
            // Close the database
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
        // Clean up the temporary file
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

  // Import TaskWarrior file (JSON or SQLite)
  app.post("/api/taskwarrior/import", upload.single("file"), async (req, res) => {
    console.log("=== TASKWARRIOR IMPORT ENDPOINT CALLED ===");
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Check if this is a SQLite file by looking at the first few bytes (SQLite header)
      // SQLite files start with "SQLite format 3\0"
      const isSqliteFile = req.file.buffer.length >= 16 && 
                          (req.file.buffer.slice(0, 16).toString('utf8').includes('SQLite') || 
                           req.file.buffer.slice(0, 16).toString('binary').includes('SQLite') ||
                           req.file.originalname.toLowerCase().endsWith('.sqlite') ||
                           req.file.originalname.toLowerCase().endsWith('.sqlite3') ||
                           req.file.originalname.toLowerCase().endsWith('.db'));
      
      console.log("File type detection:", isSqliteFile ? "SQLite database" : "Possibly JSON");
      
      let taskwarriorTasks: any[] = [];
      
      if (isSqliteFile) {
        taskwarriorTasks = readTasksFromSqlite(req.file.buffer);
        if (taskwarriorTasks.length === 0) {
          return res.status(400).json({ 
            message: "No tasks found in the SQLite database or not a valid TaskChampion database file" 
          });
        }
      } else {
        // Process as JSON
        const fileContent = req.file.buffer.toString();
        console.log("Raw file content:", fileContent.substring(0, 200) + "..."); // Log the first 200 chars
        
        try {
          let parseSuccess = false;
        
          // Approach 1: Try parsing as a single JSON object
          try {
            console.log("Trying to parse as single JSON object");
            const singleTask = JSON.parse(fileContent.trim());
            console.log("Single task parse result:", JSON.stringify(singleTask).substring(0, 100));
            
            // If it's a single task as an object, put it in an array
            if (singleTask && typeof singleTask === 'object') {
              taskwarriorTasks = [singleTask];
              parseSuccess = true;
              console.log("Successfully parsed as single task object");
            }
          } catch (err) {
            console.log("Single task parse failed:", err instanceof Error ? err.message : String(err));
            
            // Approach 2: Try the original approach - one JSON object per line
            try {
              console.log("Trying to parse as multiple JSON objects per line");
              const lines = fileContent.trim().split("\n");
              console.log("Split into", lines.length, "lines");
              taskwarriorTasks = lines.map(line => JSON.parse(line));
              parseSuccess = true;
              console.log("Successfully parsed as multi-line JSON");
            } catch (err) {
              console.log("Multi-line parse failed:", err instanceof Error ? err.message : String(err));
            }
          }
          
          // Approach 3: Try parsing the file as an array of tasks
          if (!parseSuccess) {
            try {
              console.log("Trying to parse as JSON array");
              // Try parsing as a JSON array
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
          
          // Approach 4: Try to extract JSON objects from the text with regex
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
                    if (task && typeof task === 'object' && task.description) {
                      validTasks.push(task);
                    }
                  } catch (e) {
                    // Skip invalid JSON
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
          
          // If we didn't get any tasks, it's an invalid format
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

      // Debug the first task
      if (taskwarriorTasks.length > 0) {
        console.log("First task properties:", Object.keys(taskwarriorTasks[0]));
      }
      
      for (const twTask of taskwarriorTasks) {
        try {
          // Skip tasks that don't have a description
          if (!twTask.description) {
            console.log("Skipping task without description:", twTask);
            skippedCount++;
            continue;
          }
          
          console.log("Processing task:", twTask.description);
          
          // Convert TaskWarrior task to our app's format
          let title = twTask.description || "Untitled Task";
          let context = null;
          let project = null;
          let dueDate = null;
          let tags = [];

          // Try to extract context, project, and tags from the description using GTD syntax
          // Format should be: Task +tag1 +tag2 @context pro:project due:YYYY-MM-DD
          
          // Extract context from description if it contains @context
          const contextMatch = title.match(/@(\w+)/);
          if (contextMatch && contextMatch[1]) {
            context = contextMatch[1];
            // Remove the @context from the title
            title = title.replace(contextMatch[0], '').trim();
          }
          
          // Extract project from description if it contains pro:project
          const projectMatch = title.match(/\bpro:(\w+)/i);
          if (projectMatch && projectMatch[1]) {
            project = projectMatch[1];
            // Remove the pro:project from the title
            title = title.replace(projectMatch[0], '').trim();
          }
          
          // Extract tags from description if it contains +tag
          const tagMatches = title.match(/\+(\w+)/g);
          if (tagMatches && tagMatches.length > 0) {
            tags = tagMatches.map((tag: string) => tag.substring(1));
            // Remove the +tags from the title
            tagMatches.forEach((tag: string) => {
              title = title.replace(tag, '').trim();
            });
          }
          
          // Extract due date from description if it contains due:YYYY-MM-DD
          const dueDateMatch = title.match(/\bdue:(\d{4}-\d{2}-\d{2})/i);
          if (dueDateMatch && dueDateMatch[1]) {
            dueDate = dueDateMatch[1];
            // Remove the due:YYYY-MM-DD from the title
            title = title.replace(dueDateMatch[0], '').trim();
          }
          
          const insertTask: any = {
            // Required fields
            title: title,
            completed: twTask.status === "completed" || twTask.status === "done" || twTask.status === "deleted" || 
                      twTask.end !== undefined || twTask.status === "completed",
            notes: "",
            
            // Optional fields
            tags: tags,
            project: project,
            context: context,
            dueDate: dueDate
          };
          
          // Convert tags array to string tags in our format
          if (twTask.tags) {
            console.log("Raw tags from TaskWarrior task:", twTask.tags);
            insertTask.tags = Array.isArray(twTask.tags) ? twTask.tags : [String(twTask.tags)];
            console.log("Processed tags:", insertTask.tags);
          }
          
          // Map TaskWarrior project to our project
          if (twTask.project) {
            insertTask.project = twTask.project;
          }
          
          // Try to extract context from various places
          // From annotations - checking both string and array formats
          if (twTask.annotations) {
            // Handle annotations as a string
            if (typeof twTask.annotations === 'string') {
              const contextMatch = twTask.annotations.match(/@(\w+)/);
              if (contextMatch && contextMatch[1]) {
                insertTask.context = contextMatch[1];
              }
            } 
            // Handle annotations as an array of objects (TaskChampion format)
            else if (Array.isArray(twTask.annotations)) {
              // Loop through annotation objects and check their values
              for (const annotation of twTask.annotations) {
                if (annotation && typeof annotation.value === 'string') {
                  const contextMatch = annotation.value.match(/@(\w+)/);
                  if (contextMatch && contextMatch[1]) {
                    insertTask.context = contextMatch[1];
                    break;
                  }
                  
                  // Also check for the +@context format
                  const plusContextMatch = annotation.value.match(/\+@(\w+)/);
                  if (plusContextMatch && plusContextMatch[1]) {
                    insertTask.context = plusContextMatch[1];
                    break;
                  }
                }
              }
            }
          }
          
          // Or from tags that look like @context
          if (!insertTask.context && Array.isArray(insertTask.tags)) {
            for (const tag of insertTask.tags) {
              if (typeof tag === 'string' && tag.startsWith('@')) {
                insertTask.context = tag.substring(1);
                break;
              }
            }
          }

          // Handle due date if present
          if (twTask.due) {
            try {
              // TaskWarrior uses ISO format like "20240423T060000Z"
              const dueDate = new Date(twTask.due);
              // Format as YYYY-MM-DD
              insertTask.dueDate = dueDate.toISOString().split('T')[0];
            } catch (e) {
              console.log("Invalid due date format:", twTask.due);
            }
          }

          // Build notes with all metadata
          let notes = "";
          
          // Store original TaskWarrior ID or UUID in notes for reference
          if (twTask.uuid) {
            notes += `TaskWarrior ID: ${twTask.uuid}\n`;
          } else if (twTask.id !== undefined) {
            notes += `TaskWarrior ID: ${twTask.id}\n`;
          }
          
          if (twTask.priority) {
            notes += `Priority: ${twTask.priority}\n`;
          }
          
          // Add any other metadata
          const metadataFields = ['entry', 'modified', 'imask', 'parent'];
          for (const field of metadataFields) {
            if (twTask[field] !== undefined) {
              notes += `${field}: ${twTask[field]}\n`;
            }
          }
          
          // Handle TaskChampion annotation fields
          for (const key in twTask) {
            if (key.startsWith('annotation_') && twTask[key]) {
              notes += `${twTask[key]}\n\n`;
            }
          }
          
          insertTask.notes = notes;

          console.log("Parsed insert task:", JSON.stringify(insertTask));
          
          // Look for tags with special format like "tags_@home": "x"
          // These are a common format in TaskWarrior exports
          for (const key in twTask) {
            if (key.startsWith('tags_')) {
              // Extract the tag name after "tags_"
              const tagName = key.substring(5);
              if (!insertTask.tags.includes(tagName)) {
                insertTask.tags.push(tagName);
              }
              
              // If it's a context tag (starts with @), also set it as a context
              if (tagName.startsWith('@') && !insertTask.context) {
                insertTask.context = tagName.substring(1);
              }
            }
          }
          
          // Validate and create the task
          console.log("Raw insert task before validation:", insertTask);
          
          try {
            // Ensure tags is an array of strings
            if (insertTask.tags && !Array.isArray(insertTask.tags)) {
              insertTask.tags = [];
            }
            
            // Direct DB insertion bypassing Zod validation since we know the structure
            try {
              // Create a clean task object matching our schema exactly
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
                  // Make sure each tag is a string
                  return insertTask.tags.map((tag: any) => String(tag || '')).filter((tag: string) => tag.length > 0);
                })()
              };
              
              console.log("Formatted task data:", taskData);
              
              console.log("About to call storage.createTask with:", JSON.stringify(taskData, null, 2));
              
              // Insert directly using the storage interface
              try {
                const newTask = await storage.createTask(taskData);
                console.log("Successfully created task:", newTask.id);
                importedTasks.push(newTask);
              } catch (creationError) {
                console.error("ERROR CREATING TASK:", creationError);
                throw creationError; // Re-throw to be caught by the outer catch
              }
            } catch (error) {
              console.log("Storage insertion error:", error);
              
              // Last fallback - try with just the minimal required fields
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

  // Export tasks to TaskWarrior format
  app.get("/api/taskwarrior/export", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      
      const taskwarriorTasks = tasks.map(task => {
        // Generate a UUID if not already present in notes
        let uuid = '';
        const uuidMatch = task.notes?.match(/TaskWarrior ID: ([a-f0-9-]+)/i);
        if (uuidMatch && uuidMatch[1]) {
          uuid = uuidMatch[1];
        } else {
          // Generate a simple UUID (not RFC compliant but similar format)
          uuid = 'tw-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        }

        // Current timestamp in TaskWarrior format
        const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        
        // Build a description that includes GTD syntax
        let description = task.title;
        
        // Add context, project, tags, and due date to the description in GTD syntax
        // Format: "Task +tag +@context pro:project due:YYYY-MM-DD"
        if (task.tags && task.tags.length > 0) {
          task.tags.forEach(tag => {
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
        
        const twTask: any = {
          uuid,
          description: description,
          status: task.completed ? "completed" : "pending",
          entry: now,
          modified: now
        };
        
        // Add context as annotation and as a separate field if present
        if (task.context) {
          twTask.annotations = [`+@${task.context}`];
        }

        // Add due date if present
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          twTask.due = dueDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        }

        // Add project if present
        if (task.project) {
          twTask.project = task.project;
        }

        // Add tags if present
        if (task.tags && task.tags.length > 0) {
          twTask.tags = task.tags;
        }

        // Extract priority from notes if present
        if (task.notes) {
          const priorityMatch = task.notes.match(/Priority: ([HML])/);
          if (priorityMatch && priorityMatch[1]) {
            twTask.priority = priorityMatch[1];
          }
        }

        return twTask;
      });

      // TaskWarrior format is one JSON object per line
      const output = taskwarriorTasks.map(task => JSON.stringify(task)).join('\n');
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="taskwarrior-export.json"');
      res.send(output);
    } catch (error) {
      res.status(500).json({ message: "Failed to export tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
