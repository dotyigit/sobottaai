"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";

const AI_FUNCTIONS = [
  { id: "none", name: "None" },
  { id: "email", name: "Professional Email" },
  { id: "code-prompt", name: "Code Prompt" },
  { id: "summarize", name: "Summarize" },
  { id: "casual", name: "Casual Rewrite" },
  { id: "translate", name: "Translate to English" },
];

export function AiFunctionPicker() {
  const { selectedAiFunction, setSelectedAiFunction } = useSettingsStore();

  return (
    <Select
      value={selectedAiFunction ?? "none"}
      onValueChange={(v) => setSelectedAiFunction(v === "none" ? null : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select function" />
      </SelectTrigger>
      <SelectContent>
        {AI_FUNCTIONS.map((fn) => (
          <SelectItem key={fn.id} value={fn.id}>
            {fn.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
