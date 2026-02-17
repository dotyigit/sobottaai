"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Search, Trash2, Clock, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryItem {
  id: string;
  audioPath?: string;
  transcript: string;
  processedText?: string;
  modelId: string;
  language?: string;
  aiFunction?: string;
  durationMs?: number;
  createdAt: string;
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tauriInvoke<HistoryItem[]>("get_history", {
        limit: 100,
        offset: 0,
      });
      setItems(result);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchHistory = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadHistory();
      return;
    }
    try {
      setLoading(true);
      const result = await tauriInvoke<HistoryItem[]>("search_history", {
        query,
      });
      setItems(result);
    } catch (err) {
      toast.error("Failed to search history");
    } finally {
      setLoading(false);
    }
  }, [loadHistory]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await tauriInvoke("delete_history_item", { id });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error("Failed to delete item");
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchHistory(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchHistory]);

  function formatDuration(ms?: number): string {
    if (!ms) return "";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Recording History</h1>
        {items.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({items.length})
          </span>
        )}
      </header>

      <div className="p-6 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transcriptions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p>Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Mic className="h-8 w-8 mb-3 opacity-50" />
            <p>{searchQuery ? "No matching transcriptions" : "No recordings yet"}</p>
            <p className="text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Your transcriptions will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      {item.processedText || item.transcript}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(item.createdAt)}</span>
                      {item.durationMs && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(item.durationMs)}
                        </span>
                      )}
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                        {item.modelId.replace("whisper-", "").replace("parakeet-", "")}
                      </span>
                      {item.language && (
                        <span className="uppercase">{item.language}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
