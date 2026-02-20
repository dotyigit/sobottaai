"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Server,
  Cloud,
  CircleAlert,
  CircleCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o Mini, and more",
    placeholder: "sk-...",
    defaultModel: "gpt-4o-mini",
    needsKey: true,
    docsUrl: "https://platform.openai.com/api-keys",
    icon: Cloud,
    keyPrefix: "sk-",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Sonnet, Opus, and Haiku",
    placeholder: "sk-ant-...",
    defaultModel: "claude-sonnet-4-5-20250929",
    needsKey: true,
    docsUrl: "https://console.anthropic.com/settings/keys",
    icon: Cloud,
    keyPrefix: "sk-ant-",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference for Llama and Whisper",
    placeholder: "gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
    needsKey: true,
    docsUrl: "https://console.groq.com/keys",
    icon: Cloud,
    keyPrefix: "gsk_",
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Run models locally on your machine",
    placeholder: "Not required",
    defaultModel: "llama3.2",
    needsKey: false,
    docsUrl: "https://ollama.com",
    icon: Server,
    keyPrefix: "",
  },
];

function MaskedKeyInput({
  value,
  onChange,
  placeholder,
  keyPrefix,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  keyPrefix: string;
}) {
  const [visible, setVisible] = useState(false);
  const hasValue = value.trim().length > 0;
  const looksValid = !keyPrefix || value.startsWith(keyPrefix) || value.length === 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">API Key</Label>
        {hasValue && (
          <motion.span
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center gap-1 text-[10px] font-medium",
              looksValid ? "text-emerald-500" : "text-amber-500"
            )}
          >
            {looksValid ? (
              <>
                <CircleCheck className="h-3 w-3" />
                Key saved
              </>
            ) : (
              <>
                <CircleAlert className="h-3 w-3" />
                Unexpected format
              </>
            )}
          </motion.span>
        )}
      </div>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProviderSettings() {
  const { llmProvider, setLlmProvider, providerConfigs, setProviderConfig } =
    useSettingsStore();

  const [expandedId, setExpandedId] = useState<string | null>(llmProvider);

  const handleSelect = useCallback(
    (id: string) => {
      setLlmProvider(id);
      setExpandedId(id);
    },
    [setLlmProvider]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Configure LLM providers for AI Functions and grammar correction.
          Click a provider to select it as default.
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground/70">
          <ShieldCheck className="h-3 w-3" />
          <span>All keys are stored locally on your device and never leave your machine.</span>
        </div>
      </div>

      <div className="space-y-2">
        {PROVIDERS.map((provider) => {
          const config = providerConfigs[provider.id] ?? {
            apiKey: "",
            model: provider.defaultModel,
          };
          const isActive = llmProvider === provider.id;
          const isExpanded = expandedId === provider.id;
          const hasKey = provider.needsKey ? config.apiKey.trim().length > 0 : true;
          const Icon = provider.icon;

          return (
            <motion.div
              key={provider.id}
              layout
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className={cn(
                "rounded-xl border overflow-hidden transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/[0.03]"
                  : "border-border hover:border-muted-foreground/25"
              )}
            >
              {/* Header — always visible, clickable to select */}
              <button
                onClick={() => handleSelect(provider.id)}
                className="flex items-center gap-3 w-full p-4 text-left"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{provider.name}</span>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold"
                      >
                        <Check className="h-2.5 w-2.5" />
                        Default
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {provider.description}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 shrink-0">
                  {provider.needsKey && (
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        hasKey ? "bg-emerald-500" : "bg-muted-foreground/30"
                      )}
                    />
                  )}
                  {!provider.needsKey && (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Local
                    </span>
                  )}
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 transition-colors flex items-center justify-center shrink-0",
                      isActive
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable config section */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
                      <div className="pt-3" />

                      {/* API Key input */}
                      {provider.needsKey && (
                        <MaskedKeyInput
                          value={config.apiKey}
                          onChange={(v) =>
                            setProviderConfig(provider.id, { apiKey: v })
                          }
                          placeholder={provider.placeholder}
                          keyPrefix={provider.keyPrefix}
                        />
                      )}

                      {/* Model input */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Model
                        </Label>
                        <Input
                          placeholder={provider.defaultModel}
                          value={config.model}
                          onChange={(e) =>
                            setProviderConfig(provider.id, {
                              model: e.target.value,
                            })
                          }
                          className="text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground/60">
                          Default: {provider.defaultModel}
                        </p>
                      </div>

                      {/* Ollama base URL */}
                      {provider.id === "ollama" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Base URL
                          </Label>
                          <Input
                            placeholder="http://localhost:11434"
                            value={config.baseUrl ?? ""}
                            onChange={(e) =>
                              setProviderConfig(provider.id, {
                                baseUrl: e.target.value,
                              })
                            }
                            className="text-xs font-mono"
                          />
                        </div>
                      )}

                      {/* Docs link */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground gap-1.5"
                        onClick={() => {
                          import("@tauri-apps/plugin-shell")
                            .then(({ open }) => open(provider.docsUrl))
                            .catch(() => window.open(provider.docsUrl, "_blank"));
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {provider.needsKey ? "Get API key" : "Documentation"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
