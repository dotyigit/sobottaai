"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VocabularySettings() {
  const [terms, setTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState("");

  function addTerm() {
    if (newTerm.trim() && !terms.includes(newTerm.trim())) {
      setTerms([...terms, newTerm.trim()]);
      setNewTerm("");
    }
  }

  function removeTerm(term: string) {
    setTerms(terms.filter((t) => t !== term));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Custom Vocabulary</h3>
        <p className="text-sm text-muted-foreground">
          Add specialized terms, names, and jargon to improve transcription accuracy.
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

      <div className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <span
            key={term}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
          >
            {term}
            <button onClick={() => removeTerm(term)}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {terms.length === 0 && (
          <p className="text-sm text-muted-foreground">No custom terms added yet.</p>
        )}
      </div>
    </div>
  );
}
