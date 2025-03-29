import { Task } from "@shared/schema";

interface ParsedTask {
  title: string;
  context?: string;
  project?: string;
  tags?: string[];
  dueDate?: string;
}

/**
 * Parse a task input string using GTD syntax
 * - @context or +@context: The context the task belongs to
 * - +tag: Tags associated with the task
 * - due:YYYY-MM-DD: Due date for the task
 * - pro:project: The project the task belongs to
 * 
 * Example: "Pay bills +finance +@home due:2025-04-01 pro:personal"
 */
export function parseTaskSyntax(input: string): ParsedTask {
  let title = input;
  let context: string | undefined;
  let project: string | undefined;
  let tags: string[] = [];
  let dueDate: string | undefined;
  
  // Check for TaskWarrior style context (+@context)
  const plusContextMatch = input.match(/\+@(\w+)/);
  if (plusContextMatch && plusContextMatch.length > 1) {
    context = plusContextMatch[1]; // Get the context name
    title = title.replace(plusContextMatch[0], '').trim();
  } else {
    // Fall back to standard context (@context)
    const contextMatch = input.match(/@(\w+)/);
    if (contextMatch && contextMatch.length > 1) {
      context = contextMatch[1]; // Get the context name
      title = title.replace(contextMatch[0], '').trim();
    }
  }
  
  // Extract tags (+tag)
  // Make sure we don't include +@context tags that we've already processed as contexts
  const tagRegex = context ? 
    new RegExp(`\\+((?!@${context})\\w+)`, 'g') : // Exclude the specific context we found
    /\+(?!@\w+)(\w+)/g;                          // Exclude any +@context format
    
  const tagMatches = input.match(tagRegex);
  if (tagMatches && tagMatches.length > 0) {
    tags = tagMatches.map(tag => tag.substring(1)); // Remove the + prefix
    // Remove all tags from title
    tagMatches.forEach(tag => {
      title = title.replace(tag, '').trim();
    });
  }
  
  // Extract project (pro:project)
  const projectMatch = input.match(/\bpro:(\w+)/i);
  if (projectMatch && projectMatch.length > 1) {
    project = projectMatch[1];
    title = title.replace(projectMatch[0], '').trim();
  }
  
  // Extract due date (due:YYYY-MM-DD)
  const dueDateMatch = input.match(/\bdue:(\d{4}-\d{2}-\d{2})/i);
  if (dueDateMatch && dueDateMatch.length > 1) {
    dueDate = dueDateMatch[1];
    title = title.replace(dueDateMatch[0], '').trim();
  }
  
  return {
    title,
    context,
    project,
    tags: tags.length > 0 ? tags : undefined,
    dueDate,
  };
}

/**
 * Format a task object back to GTD syntax string
 * 
 * Example: "Pay bills +finance +@home due:2025-04-01 pro:personal"
 */
export function formatTaskToSyntax(task: Task): string {
  let syntax = task.title || '';
  
  // Add tags with + prefix
  if (task.tags && task.tags.length > 0) {
    syntax += ` ${task.tags.map(tag => `+${tag}`).join(' ')}`;
  }
  
  // Add context with +@ prefix for TaskWarrior compatibility 
  if (task.context) {
    syntax += ` +@${task.context}`;
  }
  
  // Add project with pro: prefix
  if (task.project) {
    syntax += ` pro:${task.project}`;
  }
  
  // Add due date with due: prefix
  if (task.dueDate) {
    syntax += ` due:${task.dueDate}`;
  }
  
  return syntax;
}
