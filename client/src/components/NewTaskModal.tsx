// client/src/components/NewTaskModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addTask } from "@/hooks/useFirestoreTasks";
import { Task } from "@shared/schema";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function NewTaskModal({
  isOpen,
  onClose,
  onTaskAdded,
}: NewTaskModalProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>(""); // ISO string
  const [loading, setLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
  if (!title.trim()) {
    toast({ title: "Error", description: "Title is required.", variant: "destructive" });
    return;
  }

  setLoading(true);
  try {
    await addTask({
      title: title.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(context.trim() && { context: context.trim() }),
      ...(tags.length > 0 && { tags }),
      ...(dueDate && { dueDate }),
      status: "active",
    });

    toast({ title: "Success", description: "Task added!" });
    // Reset form
    setTitle("");
    setDescription("");
    setContext("");
    setTags([]);
    setTagInput("");
    setDueDate("");
    onClose();
    onTaskAdded();
  } catch (e: any) {
    toast({
      title: "Error",
      description: e.message || "Failed to add task.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Buy groceries"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Context */}
          <div>
            <Label htmlFor="context">Context</Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="@home, @work"
              disabled={loading}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                disabled={loading}
              />
              <Button
                type="button"
                size="icon"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-500"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
