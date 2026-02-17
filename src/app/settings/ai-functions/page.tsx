"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AiFunction {
  id: string;
  name: string;
  prompt: string;
  provider: string;
  model?: string;
  isBuiltin: boolean;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
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
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to save AI function");
    }
  }

  async function deleteFunction(id: string) {
    try {
      await invoke("delete_ai_function", { functionId: id });
      setFunctions((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      toast.error("Failed to delete AI function");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">AI Functions</h3>
        <p className="text-sm text-muted-foreground">
          Post-transcription text processing with AI. Select a function before recording
          to automatically process your transcription.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="space-y-3">
          {functions.map((fn) => (
            <div key={fn.id} className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fn.name}</span>
                  <Badge variant="outline">
                    {fn.isBuiltin ? "Built-in" : "Custom"}
                  </Badge>
                </div>
                {!fn.isBuiltin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFunction(fn.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{fn.prompt}</p>
            </div>
          ))}
        </div>
      )}

      {showCreate ? (
        <div className="rounded-lg border p-4 space-y-4">
          <h4 className="font-medium">Create Custom Function</h4>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Meeting Notes"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>System Prompt</Label>
            <Textarea
              placeholder="e.g., Convert the following text into structured meeting notes with action items..."
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={createFunction} disabled={!newName.trim() || !newPrompt.trim()}>
              Create
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Function
        </Button>
      )}
    </div>
  );
}
