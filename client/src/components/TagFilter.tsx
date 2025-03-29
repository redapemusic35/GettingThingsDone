import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function TagFilter({ 
  tags,
  selectedTag,
  onSelectTag 
}: TagFilterProps) {
  if (!tags.length) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-2">Filter by tag:</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-1">
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onSelectTag(null)}
              >
                All Tags
              </Badge>
              
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onSelectTag(tag)}
                >
                  +{tag}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}