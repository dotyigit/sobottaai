"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";

const LOCAL_MODELS = [
  { id: "whisper-tiny", name: "Whisper Tiny" },
  { id: "whisper-base", name: "Whisper Base" },
  { id: "whisper-small", name: "Whisper Small" },
  { id: "whisper-medium", name: "Whisper Medium" },
  { id: "whisper-large-v3-turbo", name: "Whisper Large V3 Turbo" },
  { id: "parakeet-tdt-0.6b-v2", name: "Parakeet TDT v2 (EN)" },
  { id: "parakeet-tdt-0.6b-v3", name: "Parakeet TDT v3 (Multi)" },
];

const CLOUD_MODELS = [
  { id: "cloud-openai-whisper", name: "OpenAI Whisper (Cloud)" },
  { id: "cloud-groq-whisper", name: "Groq Whisper (Cloud)" },
];

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useSettingsStore();

  return (
    <Select value={selectedModel} onValueChange={setSelectedModel}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Local Models</SelectLabel>
          {LOCAL_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Cloud Models</SelectLabel>
          {CLOUD_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
