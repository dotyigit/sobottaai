"use client";

import { Badge } from "@/components/ui/badge";

const BUILTIN_FUNCTIONS = [
  { id: "email", name: "Professional Email", description: "Rewrite as a professional email with greeting and sign-off" },
  { id: "code-prompt", name: "Code Prompt", description: "Convert spoken description to a structured code prompt" },
  { id: "summarize", name: "Summarize", description: "Concise summary capturing key points" },
  { id: "casual", name: "Casual Rewrite", description: "Rewrite in a casual, friendly tone" },
  { id: "translate", name: "Translate to English", description: "Translate or improve clarity" },
];

export default function AiFunctionsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">AI Functions</h3>
        <p className="text-sm text-muted-foreground">
          Post-transcription text processing with AI. Select a function before recording.
        </p>
      </div>

      <div className="space-y-3">
        {BUILTIN_FUNCTIONS.map((fn) => (
          <div key={fn.id} className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{fn.name}</span>
              <Badge variant="outline">Built-in</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{fn.description}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Custom AI functions coming in a future update.
      </p>
    </div>
  );
}
