import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Task } from '@shared/schema';
import Layout from '@/components/Layout';
import TaskList from '@/components/TaskList';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function Projects() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Query to get all tasks
  const { data: allTasks, isLoading: isLoadingAllTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks/active'],
  });

  // Query to get tasks for a specific project when one is selected
  const { data: projectTasks, isLoading: isLoadingProjectTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks/project', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/tasks/project/${selectedProject}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project tasks');
      }
      return response.json();
    },
    enabled: !!selectedProject,
  });

  // Extract unique project names from all tasks
  useEffect(() => {
    if (allTasks) {
      const uniqueProjects = Array.from(
        new Set(
          allTasks
            .filter((task) => task.project)
            .map((task) => task.project as string)
        )
      );
      setProjects(uniqueProjects);

      // If there are projects and none is selected, select the first one
      if (uniqueProjects.length > 0 && !selectedProject) {
        setSelectedProject(uniqueProjects[0]);
      }
    }
  }, [allTasks, selectedProject]);

  // Tasks to display - either filtered by project or all tasks
  const { tasks } = useFirestoreTasks("project", selectedProject);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Projects</h1>

        {/* Projects filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Select Project</h2>
          <div className="flex flex-wrap gap-2">
            {isLoadingAllTasks ? (
              <>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <Badge
                  key={project}
                  variant={selectedProject === project ? 'default' : 'outline'}
                  className="cursor-pointer text-sm px-3 py-1"
                  onClick={() => setSelectedProject(project)}
                >
                  {project}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground">No projects found. Add tasks with "pro:project" to create projects.</p>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Project tasks */}
        {selectedProject ? (
          <Card>
            <CardHeader>
              <CardTitle>Tasks in Project: {selectedProject}</CardTitle>
              <CardDescription>All active tasks for this project</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjectTasks ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : projectTasks && projectTasks.length > 0 ? (
                <TaskList tasks={projectTasks} />
              ) : (
                <p className="text-muted-foreground">No tasks in this project.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Select a project to view its tasks</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
