"use client";

import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Trash2, Loader2 } from "lucide-react";
import * as commands from "@/lib/tauri-commands";

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

export default function ModelSettings() {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    const unlisten = listen<DownloadProgress>(
      "model-download-progress",
      (event) => {
        setProgress(event.payload);
      },
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  async function loadModels() {
    try {
      const result = await commands.listModels();
      setModels(result as unknown as ModelStatus[]);
    } catch {
      // Will fail outside Tauri context
    }
  }

  async function handleDownload(modelId: string) {
    setDownloading(modelId);
    setProgress(null);
    try {
      await commands.downloadModel(modelId);
      await loadModels();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(null);
      setProgress(null);
    }
  }

  async function handleDelete(modelId: string) {
    try {
      await commands.deleteModel(modelId);
      await loadModels();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes >= 1_000_000_000)
      return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
    return `${(bytes / 1_000_000).toFixed(0)} MB`;
  }

  function getEngineLabel(engine: string): string {
    if (typeof engine === "string") return engine;
    if ("Whisper" in (engine as Record<string, unknown>)) return "Whisper";
    if ("Parakeet" in (engine as Record<string, unknown>)) return "Parakeet";
    return "Unknown";
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Models</h3>
        <p className="text-sm text-muted-foreground">
          Download and manage transcription models. Models are stored locally.
        </p>
      </div>

      <div className="space-y-3">
        {models.map((model) => {
          const isDownloading = downloading === model.id;
          const currentProgress =
            isDownloading && progress?.modelId === model.id ? progress : null;

          return (
            <div
              key={model.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <Badge variant="outline">
                      {getEngineLabel(model.engine)}
                    </Badge>
                    <Badge variant="outline">
                      {formatSize(model.sizeBytes)}
                    </Badge>
                    {model.downloaded && (
                      <Badge variant="secondary">Downloaded</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {model.description}
                  </p>
                </div>
                <div>
                  {isDownloading ? (
                    <Button variant="outline" size="sm" disabled>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Downloading
                    </Button>
                  ) : model.downloaded ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(model.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(model.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>

              {/* Download progress */}
              {currentProgress && (
                <div className="space-y-1">
                  <Progress value={currentProgress.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {currentProgress.fileName} ({currentProgress.fileIndex + 1}/
                      {currentProgress.fileCount})
                    </span>
                    <span>
                      {formatSize(currentProgress.bytesDownloaded)} /{" "}
                      {formatSize(currentProgress.totalBytes)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {models.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Loading model catalog...
          </p>
        )}
      </div>
    </div>
  );
}
