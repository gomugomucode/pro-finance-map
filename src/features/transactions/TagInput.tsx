import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags = [], onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && trimmed.length <= 30) {
      const nextTags = [...tags, trimmed];
      onChange(nextTags);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Tags</label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-surface/30 p-2 min-h-10">
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="gap-1 bg-muted hover:bg-muted/80 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="rounded-full p-0.5 hover:bg-background/20"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="flex items-center gap-1 min-w-[120px] flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag..."
            className="h-6 border-0 bg-transparent p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
            maxLength={30}
          />
          {input.trim() && (
            <button
              type="button"
              onClick={addTag}
              className="rounded p-1 hover:bg-accent text-primary"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
