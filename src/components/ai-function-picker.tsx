"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";

interface AiFunction {
  id: string;
  name: string;
  isBuiltin: boolean;
}

export function AiFunctionPicker() {
  const { selectedAiFunction, setSelectedAiFunction } = useSettingsStore();
  const [functions, setFunctions] = useState<AiFunction[]>([]);

  useEffect(() => {
    import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke<AiFunction[]>("list_ai_functions"))
      .then(setFunctions)
      .catch(() => {
        // Fallback to built-in list outside Tauri
        setFunctions([
          { id: "email", name: "Professional Email", isBuiltin: true },
          { id: "code-prompt", name: "Code Prompt", isBuiltin: true },
          { id: "summarize", name: "Summarize", isBuiltin: true },
          { id: "casual", name: "Casual Rewrite", isBuiltin: true },
          { id: "translate", name: "Translate to English", isBuiltin: true },
        ]);
      });
  }, []);

  return (
    <Select
      value={selectedAiFunction ?? "none"}
      onValueChange={(v) => setSelectedAiFunction(v === "none" ? null : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select function" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {functions.map((fn) => (
          <SelectItem key={fn.id} value={fn.id}>
            {fn.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
