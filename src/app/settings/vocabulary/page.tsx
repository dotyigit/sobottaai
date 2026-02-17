"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
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
    } catch (err) {
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
    if (terms.some((t) => t.term === trimmed)) return;
    try {
      await invoke("add_term", { term: trimmed });
      setNewTerm("");
      await loadTerms();
    } catch (err) {
      toast.error("Failed to add term");
    }
  }

  async function removeTerm(id: string) {
    try {
      await invoke("delete_term", { id });
      setTerms((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      toast.error("Failed to delete term");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Custom Vocabulary</h3>
        <p className="text-sm text-muted-foreground">
          Add specialized terms, names, and jargon to improve transcription accuracy.
          These terms are passed to the STT engine as hints.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a term..."
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTerm()}
        />
        <Button onClick={addTerm} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {terms.map((term) => (
            <span
              key={term.id}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
            >
              {term.term}
              <button onClick={() => removeTerm(term.id)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {terms.length === 0 && (
            <p className="text-sm text-muted-foreground">No custom terms added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
