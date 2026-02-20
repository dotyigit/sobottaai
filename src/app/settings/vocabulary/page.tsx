"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { X, Loader2, BookOpen, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


interface VocabularyTerm {
  id: string;
  term: string;
  replacement?: string;
  createdAt: string;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

export default function VocabularySettings() {
  const [terms, setTerms] = useState<VocabularyTerm[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTerms = useCallback(async () => {
    try {
      const data = await invoke<VocabularyTerm[]>("get_vocabulary");
      setTerms(data);
    } catch {
      toast.error("Failed to load vocabulary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  async function addTerm() {
    const trimmed = newTerm.trim();
    if (!trimmed) return;
    if (terms.some((t) => t.term.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Term already exists");
      return;
    }
    try {
      await invoke("add_term", { term: trimmed });
      setNewTerm("");
      await loadTerms();
    } catch {
      toast.error("Failed to add term");
    }
  }

  async function removeTerm(id: string) {
    try {
      await invoke("delete_term", { id });
      setTerms((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to delete term");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Custom Vocabulary</h3>
        <p className="text-sm text-muted-foreground">
          Add specialized terms, names, and jargon to improve transcription accuracy.
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-1.5">
          Works with Whisper and cloud models. Parakeet models do not support vocabulary hints.
        </p>
      </div>

      {/* Input */}
      <div className="relative">
        <Input
          placeholder="Type a term and press Enter..."
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTerm()}
          className="pr-24 text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {newTerm.trim() ? (
            <Button size="sm" onClick={addTerm} className="h-6 text-[10px] px-2 gap-1">
              Add
              <CornerDownLeft className="h-2.5 w-2.5" />
            </Button>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
              <CornerDownLeft className="h-2.5 w-2.5" />
              Enter
            </span>
          )}
        </div>
      </div>

      {/* Term count */}
      {!loading && terms.length > 0 && (
        <p className="text-[11px] text-muted-foreground/50">
          {terms.length} {terms.length === 1 ? "term" : "terms"}
        </p>
      )}

      {/* Terms */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading vocabulary...
        </div>
      ) : terms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-10 text-center"
        >
          <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
            <BookOpen className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No terms yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1 max-w-[240px]">
            Add technical terms, names, or abbreviations that the model might not recognize.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {terms.map((term) => (
              <motion.span
                key={term.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
                layout
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm"
              >
                {term.term}
                <button
                  onClick={() => removeTerm(term.id)}
                  className="text-muted-foreground/30 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
