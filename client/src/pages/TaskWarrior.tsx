import Layout from "@/components/Layout";
import TaskWarriorSync from "@/components/TaskWarriorSync";

export default function TaskWarrior() {
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">TaskWarrior Integration</h1>
        <p className="mb-6 text-muted-foreground">
          Sync your tasks with TaskWarrior, a command-line task management tool.
          Import existing TaskWarrior tasks or export your current tasks to use in TaskWarrior.
        </p>
        <TaskWarriorSync />

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">How to use TaskWarrior integration</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Import from TaskWarrior</h3>
              <p className="text-muted-foreground">
                To import your TaskWarrior tasks, first export them from the command line:
              </p>
              <pre className="bg-muted p-3 rounded-md mt-2 overflow-x-auto">
                <code>task export &gt; tasks.json</code>
              </pre>
              <p className="mt-2 text-muted-foreground">
                Then upload the JSON file using the import form above.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Export to TaskWarrior</h3>
              <p className="text-muted-foreground">
                To export your tasks to TaskWarrior format, click the Export button above.
                Once downloaded, import the file into TaskWarrior:
              </p>
              <pre className="bg-muted p-3 rounded-md mt-2 overflow-x-auto">
                <code>task import taskwarrior-export.json</code>
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium">Mapping between GTD and TaskWarrior</h4>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>GTD tasks &rarr; TaskWarrior tasks</li>
                <li>Projects are mapped directly between both systems</li>
                <li>Tags are mapped directly between both systems</li>
                <li>GTD contexts are not available in TaskWarrior</li>
                <li>TaskWarrior priorities (H/M/L) are stored in task notes</li>
                <li>Due dates are preserved in both directions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}