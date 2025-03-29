import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, Download, Upload, Loader2, AlertTriangle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TaskWarriorSync() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingSample, setIsImportingSample] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number, skippedCount: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportResult(null);
      setImportError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a TaskWarrior JSON file to import",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading file:", file.name, "size:", file.size, "type:", file.type);
      const response = await fetch("/api/taskwarrior/import", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to import tasks");
      }

      setImportResult({
        importedCount: data.importedCount,
        skippedCount: data.skippedCount
      });

      toast({
        title: "Import successful",
        description: `Imported ${data.importedCount} tasks. Skipped ${data.skippedCount} tasks.`,
        variant: "default"
      });

      // Refresh all tasks data
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks/active"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/contexts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });

    } catch (error) {
      console.error("Import error:", error);
      
      // More detailed error message for better debugging
      let errorDescription = "Failed to import tasks";
      
      if (error instanceof Error) {
        errorDescription = error.message;
      }
      
      // If we have a response with details in JSON format
      try {
        if (error instanceof Response) {
          const errorData = await error.json();
          if (errorData && errorData.message) {
            errorDescription = errorData.message;
          }
          if (errorData && errorData.details) {
            errorDescription += `: ${errorData.details}`;
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors on the error object
      }
      
      // Set the error state to display it in the UI
      setImportError(errorDescription);
      
      toast({
        title: "Import failed",
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSample = async () => {
    setIsImportingSample(true);
    setImportResult(null);
    setImportError(null);

    try {
      const response = await fetch("/api/taskwarrior/import-sample");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to import sample task");
      }

      setImportResult({
        importedCount: data.importedCount || 1,
        skippedCount: 0
      });

      toast({
        title: "Sample import successful",
        description: "A sample task has been imported to test system functionality",
        variant: "default"
      });

      // Refresh all tasks data
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks/active"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/contexts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });

    } catch (error) {
      console.error("Sample import error:", error);
      
      let errorMessage = "Failed to import sample task";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Set the error message in the UI
      setImportError(errorMessage);
      
      toast({
        title: "Sample import failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImportingSample(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Direct download with browser
      window.location.href = "/api/taskwarrior/export";
      
      toast({
        title: "Export started",
        description: "Your TaskWarrior export file is being downloaded",
        variant: "default"
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export tasks to TaskWarrior format",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    }
  };

  return (
    <Card className="mt-6 w-full">
      <CardHeader>
        <CardTitle>TaskWarrior Sync</CardTitle>
        <CardDescription>
          Import and export tasks from TaskWarrior JSON format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-medium">Import from TaskWarrior</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Upload a TaskWarrior JSON file. The file can contain a single task object or multiple tasks (one per line).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Alert className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>TaskWarrior Format Support</AlertTitle>
            <AlertDescription>
              You can upload files in the following formats:
              <ul className="list-disc pl-5 mt-1">
                <li>TaskWarrior JSON export file (one task per line)</li>
                <li>TaskChampion SQLite database file (taskchampion.sqlite3)</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Input 
              type="file" 
              accept=".json,.sqlite,.sqlite3,application/x-sqlite3,application/vnd.sqlite3" 
              onChange={handleFileChange} 
              className="max-w-sm" 
            />
            <Button 
              onClick={handleImport} 
              disabled={!file || isImporting}
              className="flex items-center gap-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Example format: <code className="bg-muted px-1 py-0.5 rounded">{"{'description': 'My task', 'due': '20240423T060000Z'}"}</code>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          
          <div className="mt-3">
            <Button 
              onClick={handleImportSample} 
              disabled={isImportingSample}
              variant="outline"
              className="flex items-center gap-1"
            >
              {isImportingSample ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding Sample Task...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Import Sample Task
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-1">
              Add a test task to verify the import system works.
            </p>
          </div>
          
          {importResult && (
            <Alert className="mt-4">
              <Check className="h-4 w-4" />
              <AlertDescription>
                Successfully imported {importResult.importedCount} tasks. 
                {importResult.skippedCount > 0 && ` Skipped ${importResult.skippedCount} tasks.`}
              </AlertDescription>
            </Alert>
          )}
          
          {importError && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Import Error</AlertTitle>
              <AlertDescription>
                {importError}
                <p className="mt-2 text-sm">
                  Try exporting your tasks in a different format from TaskWarrior or using the sample import feature to test the system.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Export to TaskWarrior</h3>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="flex items-center gap-1"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Tasks
              </>
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Note: TaskWarrior context mapping is not fully compatible. Contexts in GTD app will need to be set manually.
      </CardFooter>
    </Card>
  );
}