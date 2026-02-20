"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Sparkles,
  Code2,
  FileText,
  PenLine,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AiFunction {
  id: string;
  name: string;
  prompt: string;
  provider: string;
  model?: string;
  isBuiltin: boolean;
}

const BUILTIN_ICONS: Record<string, typeof Sparkles> = {
  email: PenLine,
  "code-prompt": Code2,
  summarize: FileText,
};

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

function FunctionCard({
  fn,
  onDelete,
  index,
}: {
  fn: AiFunction;
  onDelete?: () => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = BUILTIN_ICONS[fn.id] ?? Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04 }}
      layout
      className={cn(
        "rounded-xl border overflow-hidden transition-colors",
        fn.isBuiltin ? "border-border" : "border-dashed border-border"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start gap-3 w-full p-4 text-left"
      >
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
            fn.isBuiltin
              ? "bg-primary/10 text-primary"
              : "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{fn.name}</span>
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                fn.isBuiltin
                  ? "text-muted-foreground/60 bg-muted/50"
                  : "text-amber-600/60 bg-amber-500/10 dark:text-amber-400/60"
              )}
            >
              {fn.isBuiltin ? "Built-in" : "Custom"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {fn.prompt}
          </p>
        </div>

        {/* Delete for custom */}
        {!fn.isBuiltin && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0 text-muted-foreground/40 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </button>

      {/* Expanded prompt view */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50">
              <div className="pt-3">
                <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  System Prompt
                </Label>
                <p className="text-xs text-muted-foreground mt-1.5 font-mono leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                  {fn.prompt}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AiFunctionsSettings() {
  const [functions, setFunctions] = useState<AiFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  const loadFunctions = useCallback(async () => {
    try {
      const data = await invoke<AiFunction[]>("list_ai_functions");
      setFunctions(data);
    } catch {
      toast.error("Failed to load AI functions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunctions();
  }, [loadFunctions]);

  async function createFunction() {
    if (!newName.trim() || !newPrompt.trim()) return;
    try {
      const id = `custom-${Date.now()}`;
      await invoke("save_ai_function", {
        function: {
          id,
          name: newName.trim(),
          prompt: newPrompt.trim(),
          provider: "default",
          model: null,
          isBuiltin: false,
        },
      });
      setNewName("");
      setNewPrompt("");
      setShowCreate(false);
      await loadFunctions();
      toast.success("Function created");
    } catch {
      toast.error("Failed to save AI function");
    }
  }

  async function deleteFunction(id: string) {
    try {
      await invoke("delete_ai_function", { functionId: id });
      setFunctions((prev) => prev.filter((f) => f.id !== id));
      toast.success("Function deleted");
    } catch {
      toast.error("Failed to delete AI function");
    }
  }

  const builtinFns = functions.filter((f) => f.isBuiltin);
  const customFns = functions.filter((f) => !f.isBuiltin);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">AI Functions</h3>
        <p className="text-sm text-muted-foreground">
          Post-processing with AI. Select a function before recording to automatically
          transform your transcription.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-3 w-48 rounded bg-muted/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Built-in functions */}
          {builtinFns.length > 0 && (
            <div className="space-y-2">
              {builtinFns.map((fn, i) => (
                <FunctionCard key={fn.id} fn={fn} index={i} />
              ))}
            </div>
          )}

          {/* Custom functions */}
          {customFns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Custom
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <AnimatePresence>
                {customFns.map((fn, i) => (
                  <FunctionCard
                    key={fn.id}
                    fn={fn}
                    index={i}
                    onDelete={() => deleteFunction(fn.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Create form */}
      <AnimatePresence mode="wait">
        {showCreate ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <h4 className="font-medium text-sm">New Custom Function</h4>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  placeholder="e.g., Meeting Notes"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">System Prompt</Label>
                <Textarea
                  placeholder="e.g., Convert the following text into structured meeting notes with action items..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
                <p className="text-[10px] text-muted-foreground/50">
                  The transcribed text will be appended after this prompt.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={createFunction}
                  disabled={!newName.trim() || !newPrompt.trim()}
                  className="text-xs"
                >
                  Create Function
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreate(false);
                    setNewName("");
                    setNewPrompt("");
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create custom function
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
