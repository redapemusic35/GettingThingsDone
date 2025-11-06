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

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
}

export default function NewTaskModal({
  isOpen,
  onClose,
  onTaskAdded,
}: NewTaskModalProps) {
  const { toast } = useToast();

  // ────── FORM STATE ──────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  // ────── QUICK ADD STATE ──────
  const [quickInput, setQuickInput] = useState("");

  // ────── RESET FORM ──────
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContext("");
    setTagInput("");
    setTags([]);
    setDueDate("");
    setQuickInput("");
  };

  // ────── QUICK ADD PARSER ──────
  const parseQuickAdd = async () => {
    const text = quickInput.trim();
    if (!text) return;

    const words = text.split(/\s+/);

    // Extract special tokens
    const contextWord = words.find((w) => w.startsWith("@"))?.slice(1);
    const tagWords = words.filter((w) => w.startsWith("+")).map((w) => w.slice(1));
    const projectMatch = words.find((w) => w.startsWith("pro:"));
    const project = projectMatch?.slice(4);
    const dueMatch = words.find((w) => w.startsWith("due:"));
    const due = dueMatch?.slice(4);

    // Everything else is the title
    const titleWords = words.filter(
      (w) =>
        !w.startsWith("@") &&
        !w.startsWith("+") &&
        !w.startsWith("pro:") &&
        !w.startsWith("due:")
    );
    const titleText = titleWords.join(" ");

    if (!titleText) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await addTask({
        title: titleText,
        ...(description.trim() && { description: description.trim() }),
        ...(contextWord && { context: contextWord }),
        ...(tagWords.length > 0 && { tags: tagWords }),
        ...(project && { project }),
        ...(due && { dueDate: due }),
        status: "active",
      });

      toast({ title: "Success", description: "Task added!" });
      resetForm();
      onClose();
      onTaskAdded?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ────── REGULAR SUBMIT (kept for manual entry) ──────
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Title required", variant: "destructive" });
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
      resetForm();
      onClose();
      onTaskAdded?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ────── TAG HANDLERS ──────
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ────── QUICK ADD ────── */}
          <div>
            <Label>Quick Add</Label>
            <Input
              placeholder="Buy milk +groceries @home pro:errands due:2025-11-07"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  parseQuickAdd();
                }
              }}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to add. Use +tag, @context, pro:project, due:YYYY-MM-DD
            </p>
          </div>

          <div className="h-px bg-gray-200" />

          {/* ────── MANUAL FORM ────── */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Buy milk"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="context">Context</Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="@home"
              disabled={loading}
            />
          </div>

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
              <Button type="button" size="icon" onClick={handleAddTag} disabled={loading}>
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
          <Button variant="outline" onClick={onClose} disabled={loading}>
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
