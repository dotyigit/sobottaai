"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Cloud,
  Cpu,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  HardDrive,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as commands from "@/lib/tauri-commands";

async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<(() => void) | undefined> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen<T>(event, (e) => handler(e.payload));
  } catch {
    return undefined;
  }
}

interface ModelStatus {
  id: string;
  name: string;
  engine: string;
  sizeBytes: number;
  description: string;
  languages: string;
  downloaded: boolean;
}

interface DownloadProgress {
  modelId: string;
  fileIndex: number;
  fileCount: number;
  fileName: string;
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
}

function isCloudEngine(engine: string): boolean {
  if (typeof engine === "string") {
    return engine === "CloudOpenAI" || engine === "CloudGroq";
  }
  const obj = engine as Record<string, unknown>;
  return "CloudOpenAI" in obj || "CloudGroq" in obj;
}

function getEngineLabel(engine: string): string {
  if (typeof engine === "string") {
    if (engine === "CloudOpenAI") return "OpenAI";
    if (engine === "CloudGroq") return "Groq";
    return engine;
  }
  if ("Whisper" in (engine as Record<string, unknown>)) return "Whisper";
  if ("Parakeet" in (engine as Record<string, unknown>)) return "Parakeet";
  if ("CloudOpenAI" in (engine as Record<string, unknown>)) return "OpenAI";
  if ("CloudGroq" in (engine as Record<string, unknown>)) return "Groq";
  return "Unknown";
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000_000)
    return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  return `${(bytes / 1_000_000).toFixed(0)} MB`;
}

function ModelCard({
  model,
  isDownloading,
  progress,
  onDownload,
  onDelete,
}: {
  model: ModelStatus;
  isDownloading: boolean;
  progress: DownloadProgress | null;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const isCloud = isCloudEngine(model.engine);
  const Icon = isCloud ? Cloud : Cpu;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      className={cn(
        "rounded-xl border p-4 transition-colors",
        model.downloaded
          ? "border-border bg-card/30"
          : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center h-10 w-10 rounded-lg shrink-0",
            isCloud
              ? "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{model.name}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-1.5 py-0.5 rounded bg-muted/50">
              {getEngineLabel(model.engine)}
            </span>
            {!isCloud && (
              <span className="text-[10px] text-muted-foreground/50">
                {formatSize(model.sizeBytes)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {model.description}
          </p>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2">
          {isCloud ? (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              <Zap className="h-3 w-3" />
              API
            </span>
          ) : isDownloading ? (
            <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Downloading
            </Button>
          ) : model.downloaded ? (
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
                className="flex items-center gap-1.5 text-emerald-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Ready</span>
              </motion.div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Download progress */}
      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {/* Progress bar */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>

              {/* Progress details */}
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="font-mono">
                  {progress.fileName}
                  {progress.fileCount > 1 && (
                    <span className="text-muted-foreground/50">
                      {" "}({progress.fileIndex + 1}/{progress.fileCount})
                    </span>
                  )}
                </span>
                <span className="font-mono tabular-nums">
                  {formatSize(progress.bytesDownloaded)} / {formatSize(progress.totalBytes)}
                  <span className="text-muted-foreground/50 ml-2">
                    {progress.percentage.toFixed(0)}%
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Skeleton loading placeholder */
function ModelSkeleton() {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-4 w-14 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="h-3 w-48 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function ModelSettings() {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    tauriListen<DownloadProgress>(
      "model-download-progress",
      (payload) => setProgress(payload),
    ).then((fn) => {
      cleanup = fn;
    });
    return () => cleanup?.();
  }, []);

  async function loadModels() {
    try {
      const result = await commands.listModels();
      setModels(result as unknown as ModelStatus[]);
    } catch {
      // Fails outside Tauri
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(modelId: string) {
    setDownloading(modelId);
    setProgress(null);
    try {
      await commands.downloadModel(modelId);
      toast.success("Model downloaded successfully");
      await loadModels();
    } catch (err) {
      toast.error("Download failed", { description: String(err) });
    } finally {
      setDownloading(null);
      setProgress(null);
    }
  }

  async function handleDelete(modelId: string) {
    try {
      await commands.deleteModel(modelId);
      toast.success("Model deleted");
      await loadModels();
    } catch (err) {
      toast.error("Failed to delete model", { description: String(err) });
    }
  }

  const cloudModels = models.filter((m) => isCloudEngine(m.engine));
  const localModels = models.filter((m) => !isCloudEngine(m.engine));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Models</h3>
        <p className="text-sm text-muted-foreground">
          Download and manage transcription models. Local models run entirely on your device.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <ModelSkeleton />
          <ModelSkeleton />
          <ModelSkeleton />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cloud Models */}
          {cloudModels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Cloud className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Cloud
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              {cloudModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isDownloading={downloading === model.id}
                  progress={
                    downloading === model.id && progress?.modelId === model.id
                      ? progress
                      : null
                  }
                  onDownload={() => handleDownload(model.id)}
                  onDelete={() => handleDelete(model.id)}
                />
              ))}
            </div>
          )}

          {/* Local Models */}
          {localModels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  On Device
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              {localModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isDownloading={downloading === model.id}
                  progress={
                    downloading === model.id && progress?.modelId === model.id
                      ? progress
                      : null
                  }
                  onDownload={() => handleDownload(model.id)}
                  onDelete={() => handleDelete(model.id)}
                />
              ))}
            </div>
          )}

          {models.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Download className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No models available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your internet connection and try again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
