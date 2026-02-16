"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HistoryPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Recording History</h1>
      </header>

      <div className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search transcriptions..." className="pl-10" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p>No recordings yet</p>
          <p className="text-sm">Your transcriptions will appear here</p>
        </div>
      </ScrollArea>
    </div>
  );
}
