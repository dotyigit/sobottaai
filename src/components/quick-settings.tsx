"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Globe, Sparkles, Download, AlertCircle } from "lucide-react";
import { motion, LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { ComboboxPicker, type ComboboxOption } from "@/components/combobox-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LANGUAGE_OPTIONS: ComboboxOption[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "tr", label: "Turkish" },
  { value: "pl", label: "Polish" },
  { value: "sv", label: "Swedish" },
];

interface ModelStatus {
  id: string;
  name: string;
  engine: string;
  downloaded: boolean;
}

interface AiFunction {
  id: string;
  name: string;
  isBuiltin: boolean;
}

function PillButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  value?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors z-[1]",
        disabled
          ? "text-muted-foreground/40 cursor-not-allowed"
          : active
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="ai-function-pill"
          className="absolute inset-0 rounded-full bg-primary"
          style={{ zIndex: -1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
      {children}
    </button>
  );
}

function isCloudEngine(engine: string): boolean {
  if (typeof engine === "string") {
    return engine === "CloudOpenAI" || engine === "CloudGroq";
  }
  const obj = engine as Record<string, unknown>;
  return "CloudOpenAI" in obj || "CloudGroq" in obj;
}

export function QuickSettings() {
  const router = useRouter();
  const {
    selectedModel,
    setSelectedModel,
    selectedLanguage,
    setSelectedLanguage,
    selectedAiFunction,
    setSelectedAiFunction,
    llmProvider,
    providerConfigs,
  } = useSettingsStore();

  const [modelOptions, setModelOptions] = useState<ComboboxOption[]>([]);
  const [noModels, setNoModels] = useState(false);
  const [functions, setFunctions] = useState<AiFunction[]>([]);

  // Check if the active LLM provider has a valid configuration
  const activeConfig = providerConfigs[llmProvider];
  const hasLlmConfigured =
    llmProvider === "ollama"
      ? true // Ollama doesn't need an API key
      : !!(activeConfig?.apiKey?.trim());

  // Check which cloud providers have keys
  const hasOpenAiKey = !!(providerConfigs["openai"]?.apiKey?.trim());
  const hasGroqKey = !!(providerConfigs["groq"]?.apiKey?.trim());

  // Load available models — only downloaded local + cloud with valid keys
  useEffect(() => {
    import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke<ModelStatus[]>("list_models"))
      .then((models) => {
        const available = models.filter((m) => {
          if (isCloudEngine(m.engine)) {
            // Only show cloud model if the matching API key is set
            const eng = typeof m.engine === "string" ? m.engine : "";
            if (eng === "CloudOpenAI" || m.id.includes("openai")) return hasOpenAiKey;
            if (eng === "CloudGroq" || m.id.includes("groq")) return hasGroqKey;
            return false;
          }
          return m.downloaded;
        });
        if (available.length === 0) {
          setNoModels(true);
          setModelOptions([]);
        } else {
          setNoModels(false);
          setModelOptions(
            available.map((m) => ({
              value: m.id,
              label: m.name,
              group: isCloudEngine(m.engine) ? "Cloud" : "Local",
            }))
          );
          // If the currently selected model isn't available, auto-select the first one
          if (!available.some((m) => m.id === selectedModel)) {
            setSelectedModel(available[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback for outside Tauri
        setModelOptions([
          { value: "whisper-base", label: "Whisper Base", group: "Local" },
        ]);
      });
  }, [selectedModel, setSelectedModel, hasOpenAiKey, hasGroqKey]);

  // Load AI functions
  useEffect(() => {
    import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke<AiFunction[]>("list_ai_functions"))
      .then(setFunctions)
      .catch(() => {
        setFunctions([
          { id: "email", name: "Email", isBuiltin: true },
          { id: "code-prompt", name: "Code", isBuiltin: true },
          { id: "summarize", name: "Summarize", isBuiltin: true },
        ]);
      });
  }, []);

  // Show first 3 as inline pills
  const topFunctions = functions.slice(0, 3);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left section — Transcription settings */}
        <div className="flex items-center gap-2">
          {noModels ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push("/settings/models")}
                  className="flex items-center gap-2 rounded-full border border-dashed border-muted-foreground/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download a model
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>No models downloaded yet. Click to download one.</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <ComboboxPicker
              options={modelOptions}
              value={selectedModel}
              onValueChange={setSelectedModel}
              placeholder="Model"
              searchPlaceholder="Search models..."
              icon={<Box className="h-3.5 w-3.5" />}
            />
          )}

          <div className="h-4 w-px bg-border" />

          <ComboboxPicker
            options={LANGUAGE_OPTIONS}
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
            placeholder="Language"
            searchPlaceholder="Search languages..."
            icon={<Globe className="h-3.5 w-3.5" />}
          />
        </div>

        {/* Right section — AI Function */}
        <Tooltip>
          <TooltipTrigger asChild>
            <LayoutGroup>
              <div
                className={cn(
                  "flex items-center gap-0.5 rounded-full border p-0.5",
                  hasLlmConfigured ? "bg-background" : "bg-muted/50 border-dashed"
                )}
              >
                <PillButton
                  value="none"
                  active={!selectedAiFunction}
                  disabled={false}
                  onClick={() => setSelectedAiFunction(null)}
                >
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  None
                </PillButton>
                {topFunctions.map((fn) => (
                  <PillButton
                    key={fn.id}
                    value={fn.id}
                    active={selectedAiFunction === fn.id}
                    disabled={!hasLlmConfigured}
                    onClick={() => {
                      if (hasLlmConfigured) {
                        setSelectedAiFunction(fn.id);
                      }
                    }}
                  >
                    {fn.name}
                  </PillButton>
                ))}
                {!hasLlmConfigured && (
                  <AlertCircle className="h-3 w-3 mx-1 text-muted-foreground/50" />
                )}
              </div>
            </LayoutGroup>
          </TooltipTrigger>
          {!hasLlmConfigured && (
            <TooltipContent>
              <p>Add an API key in Settings &gt; API Keys to use AI functions</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
