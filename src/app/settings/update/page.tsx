"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  checkForUpdate,
  getAppVersion,
  restartApp,
  type Update,
  type UpdaterDownloadEvent,
} from "@/lib/tauri-commands";
import { cn } from "@/lib/utils";

type UpdateState =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "installing"
  | "installed"
  | "unsupported"
  | "error";

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDate(date?: string): string {
  if (!date) return "Unknown release date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown release date";
  return parsed.toLocaleString();
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export default function UpdateSettingsPage() {
  const [state, setState] = useState<UpdateState>("idle");
  const [currentVersion, setCurrentVersion] = useState("0.1.1");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState<string | undefined>();
  const [releaseNotes, setReleaseNotes] = useState<string | undefined>();
  const [statusMessage, setStatusMessage] = useState("Check GitHub releases for updates.");
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [contentLength, setContentLength] = useState<number | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);

  useEffect(() => {
    let mounted = true;

    getAppVersion()
      .then((version) => {
        if (mounted) {
          setCurrentVersion(version);
        }
      })
      .catch(() => {
        // Outside Tauri (web preview/tests)
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pendingUpdate) {
        void pendingUpdate.close().catch(() => {});
      }
    };
  }, [pendingUpdate]);

  const progress = useMemo(() => {
    if (!contentLength || contentLength <= 0) return 0;
    return Math.min(100, (downloadedBytes / contentLength) * 100);
  }, [downloadedBytes, contentLength]);

  const hasPendingUpdate = !!pendingUpdate;
  const busy =
    state === "checking" ||
    state === "downloading" ||
    state === "installing" ||
    isRestarting;

  const replacePendingUpdate = useCallback(async (next: Update | null) => {
    setPendingUpdate((previous) => {
      if (previous && previous !== next) {
        void previous.close().catch(() => {});
      }
      return next;
    });
  }, []);

  const runCheck = useCallback(async (showToast = true) => {
    if (!isTauriRuntime()) {
      setState("unsupported");
      setStatusMessage("Updater is only available in the desktop app.");
      return;
    }

    setState("checking");
    setStatusMessage("Checking for updates on GitHub...");

    try {
      const update = await checkForUpdate({ timeout: 30000 });
      setLastCheckedAt(new Date());

      if (update) {
        await replacePendingUpdate(update);
        setLatestVersion(update.version);
        setReleaseDate(update.date);
        setReleaseNotes(update.body);
        setState("available");
        setStatusMessage(`Version ${update.version} is available.`);
        if (showToast) {
          toast.success("Update available", {
            description: `A newer version (${update.version}) is ready to install.`,
          });
        }
      } else {
        await replacePendingUpdate(null);
        setLatestVersion(null);
        setReleaseDate(undefined);
        setReleaseNotes(undefined);
        setState("up-to-date");
        setStatusMessage("You are running the latest version.");
        if (showToast) {
          toast.success("You are up to date");
        }
      }
    } catch (err) {
      setState("error");
      setStatusMessage("Could not check for updates. Please try again.");
      if (showToast) {
        toast.error("Update check failed", { description: String(err) });
      }
    }
  }, [replacePendingUpdate]);

  async function installUpdate() {
    const update = pendingUpdate;
    if (!update) {
      toast.error("No update selected", {
        description: "Check for updates first.",
      });
      return;
    }

    setState("downloading");
    setStatusMessage("Downloading update package...");
    setDownloadedBytes(0);
    setContentLength(null);

    try {
      await update.downloadAndInstall((event: UpdaterDownloadEvent) => {
        handleDownloadEvent(event);
      });

      await replacePendingUpdate(null);
      setState("installed");
      setStatusMessage("Update installed. Restart SobottaAI to finish.");
      toast.success("Update installed", {
        description: "Restart the app to use the latest version.",
      });
    } catch (err) {
      setState("error");
      setStatusMessage("Update install failed. You can try again.");
      toast.error("Install failed", { description: String(err) });
    }
  }

  function handleDownloadEvent(event: UpdaterDownloadEvent) {
    switch (event.event) {
      case "Started":
        setState("downloading");
        setContentLength(event.data.contentLength ?? null);
        setDownloadedBytes(0);
        setStatusMessage("Downloading update package...");
        break;
      case "Progress":
        setDownloadedBytes((bytes) => bytes + event.data.chunkLength);
        break;
      case "Finished":
        setState("installing");
        setStatusMessage("Download complete. Installing update...");
        break;
      default:
        break;
    }
  }

  async function handleRestartNow() {
    setIsRestarting(true);
    try {
      await restartApp();
    } catch (err) {
      setIsRestarting(false);
      toast.error("Restart failed", { description: String(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Update</h3>
        <p className="text-sm text-muted-foreground">
          Check for new releases and install updates directly from GitHub.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ArrowUpCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">SobottaAI Updates</CardTitle>
                  <CardDescription className="mt-1">
                    Current version: <span className="font-medium text-foreground">v{currentVersion}</span>
                  </CardDescription>
                </div>
              </div>

              <StatusBadge state={state} />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{statusMessage}</p>

            {lastCheckedAt && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Clock3 className="h-3.5 w-3.5" />
                Last checked: {lastCheckedAt.toLocaleString()}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void runCheck(true)} disabled={busy} className="gap-1.5">
                {state === "checking" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Check for updates
              </Button>

              {hasPendingUpdate && (state === "available" || state === "error") && (
                <Button
                  variant="outline"
                  onClick={() => void installUpdate()}
                  disabled={busy}
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Download & install
                </Button>
              )}

              {state === "installed" && (
                <Button onClick={() => void handleRestartNow()} disabled={isRestarting} className="gap-1.5">
                  {isRestarting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Restart now
                </Button>
              )}
            </div>

            <AnimatePresence>
              {(state === "downloading" || state === "installing") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{state === "downloading" ? "Downloading" : "Installing"}</span>
                    {contentLength ? (
                      <span className="font-mono tabular-nums">
                        {formatBytes(downloadedBytes)} / {formatBytes(contentLength)}
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums">{formatBytes(downloadedBytes)}</span>
                    )}
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {latestVersion && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Available Release</CardTitle>
                <CardDescription>
                  New version <span className="font-medium text-foreground">v{latestVersion}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Latest: v{latestVersion}
                  </span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>{formatDate(releaseDate)}</span>
                </div>

                {releaseNotes ? (
                  <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Release Notes
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{releaseNotes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No release notes provided for this update.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ state }: { state: UpdateState }) {
  const mapping: Record<UpdateState, { label: string; className: string; icon?: React.ReactNode }> = {
    idle: {
      label: "Idle",
      className: "bg-muted text-muted-foreground",
    },
    checking: {
      label: "Checking",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    "up-to-date": {
      label: "Up to date",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    available: {
      label: "Update available",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: <ArrowUpCircle className="h-3 w-3" />,
    },
    downloading: {
      label: "Downloading",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: <Download className="h-3 w-3" />,
    },
    installing: {
      label: "Installing",
      className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    installed: {
      label: "Installed",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    unsupported: {
      label: "Unavailable",
      className: "bg-muted text-muted-foreground",
      icon: <TriangleAlert className="h-3 w-3" />,
    },
    error: {
      label: "Error",
      className: "bg-destructive/10 text-destructive",
      icon: <TriangleAlert className="h-3 w-3" />,
    },
  };

  const item = mapping[state];

  return (
    <Badge className={cn("gap-1.5 border-0", item.className)}>
      {item.icon}
      {item.label}
    </Badge>
  );
}
