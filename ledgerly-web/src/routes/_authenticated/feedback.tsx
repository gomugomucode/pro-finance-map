import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Star, Send, CheckCircle2, Bug, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const [type, setType] = useState<"bug" | "feature" | "rating">("feedback" as any || "feature");
  const [rating, setRating] = useState(5);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeLogs, setIncludeLogs] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Feedback & Support Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Submit bug reports, request new features, or rate your Ledgerly experience
            </p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="card-elevated p-8 text-center space-y-4 max-w-lg mx-auto border-emerald-500/30 bg-emerald-500/5">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Thank You for Your Feedback!</h2>
          <p className="text-xs text-muted-foreground">
            Your report has been logged successfully with diagnostic logs attached. Our engineering team reviews every submission.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
            Submit Another Entry
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-6">
          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Feedback Category</label>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={type === "feature" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("feature")}
              >
                <Lightbulb className="h-4 w-4 mr-2" /> Feature Request
              </Button>
              <Button
                type="button"
                variant={type === "bug" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("bug")}
              >
                <Bug className="h-4 w-4 mr-2" /> Bug Report
              </Button>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition"
                >
                  <Star className={`h-6 w-6 ${star <= rating ? "fill-amber-400" : "text-muted"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Subject / Summary</label>
            <Input
              placeholder="Brief summary of your feedback..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Detailed Description</label>
            <Textarea
              rows={4}
              placeholder="Explain the feature request or steps to reproduce the issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="rounded border-border"
              />
              <span>Attach anonymized system diagnostics & user metadata</span>
            </label>

            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" /> Submit Feedback
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
