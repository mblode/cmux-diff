"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "./StatusBar";
import { FileList } from "./FileList";
import { DiffViewer } from "./DiffViewer";
import type { DiffFileStat } from "@/lib/git";
import type { Comment, CommentTag } from "@/lib/comments";

interface DiffData {
  patch: string;
  baseBranch: string;
  mergeBase: string;
  branch: string;
}

interface FilesData {
  files: DiffFileStat[];
  insertions: number;
  deletions: number;
  branch: string;
  baseBranch: string;
}

const POLL_INTERVAL = 5000;

export function DiffApp({ repoPath }: { repoPath: string }) {
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [filesData, setFilesData] = useState<FilesData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [layout, setLayout] = useState<"split" | "stacked">("split");
  const [filterQuery, setFilterQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastPatchRef = useRef<string>("");

  async function fetchDiff(silent = false) {
    if (!silent) setRefreshing(true);
    setError(null);
    try {
      const [diffRes, filesRes, commentsRes] = await Promise.all([
        fetch("/api/diff"),
        fetch("/api/files"),
        fetch("/api/comments"),
      ]);

      if (!diffRes.ok || !filesRes.ok) {
        const err = await diffRes.json().catch(() => ({ error: "Network error" }));
        setError(err.error ?? "Failed to load diff");
        return;
      }

      const [diff, files, commentsData] = await Promise.all([
        diffRes.json() as Promise<DiffData>,
        filesRes.json() as Promise<FilesData>,
        commentsRes.json() as Promise<Comment[]>,
      ]);

      // Only update diff if patch changed (avoids re-render flicker)
      if (diff.patch !== lastPatchRef.current) {
        lastPatchRef.current = diff.patch;
        setDiffData(diff);
      }
      setFilesData(files);
      setComments(commentsData);
      setLastUpdated(new Date());

      // Auto-select first file
      if (!selectedFile && files.files.length > 0) {
        setSelectedFile(files.files[0].file);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRefreshing(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchDiff();
  }, []);

  // Polling
  useEffect(() => {
    const interval = setInterval(() => fetchDiff(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.key === "r") {
        fetchDiff();
      }
      if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
        setLayout((l) => (l === "split" ? "stacked" : "split"));
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder="Filter files…"]')?.focus();
      }
      // j/k navigate files
      if (e.key === "j" || e.key === "k") {
        const files = filesData?.files ?? [];
        if (files.length === 0) return;
        const idx = files.findIndex((f) => f.file === selectedFile);
        if (e.key === "j") {
          const next = files[idx + 1];
          if (next) {
            setSelectedFile(next.file);
            scrollToFile(next.file);
          }
        } else {
          const prev = files[idx - 1];
          if (prev) {
            setSelectedFile(prev.file);
            scrollToFile(prev.file);
          }
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filesData, selectedFile]);

  function scrollToFile(file: string) {
    const container = document.getElementById("diff-container");
    if (!container) return;
    const filename = file.split("/").pop() ?? file;
    const elements = container.querySelectorAll("[data-filename]");
    for (const el of elements) {
      if (el.getAttribute("data-filename")?.includes(filename)) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    // Fallback: search all text
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent?.includes(filename)) {
        node.parentElement?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }

  const handleSelectFile = useCallback(
    (file: string) => {
      setSelectedFile(file);
      scrollToFile(file);
    },
    []
  );

  const handleAddComment = useCallback(
    async (
      file: string,
      lineNumber: number,
      side: string,
      body: string,
      tag: CommentTag
    ) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, lineNumber, side, body, tag }),
      });
      if (res.ok) {
        const comment = (await res.json()) as Comment;
        setComments((prev) => [...prev, comment]);
      }
    },
    []
  );

  const handleDeleteComment = useCallback(async (id: string) => {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  if (error) {
    return (
      <div className="flex h-screen flex-col bg-[#0d1117] text-[#e6edf3]">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 px-6 py-4 text-sm text-[#f85149] max-w-md text-center">
            <p className="font-semibold mb-1">Failed to load diff</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
          <button
            onClick={() => fetchDiff()}
            className="rounded bg-[#21262d] px-4 py-2 text-sm text-[#e6edf3] hover:bg-[#30363d] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      <StatusBar
        branch={diffData?.branch ?? "…"}
        baseBranch={diffData?.baseBranch ?? "main"}
        insertions={filesData?.insertions ?? 0}
        deletions={filesData?.deletions ?? 0}
        fileCount={filesData?.files.length ?? 0}
        layout={layout}
        onLayoutToggle={() =>
          setLayout((l) => (l === "split" ? "stacked" : "split"))
        }
        onRefresh={() => fetchDiff()}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
        comments={comments}
      />

      <div className="flex flex-1 overflow-hidden">
        <FileList
          files={filesData?.files ?? []}
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          comments={comments}
          onAddComment={async (file, lineNumber, body, tag) =>
            handleAddComment(file, lineNumber, "right", body, tag)
          }
          onDeleteComment={handleDeleteComment}
          repoPath={repoPath}
          filterQuery={filterQuery}
          onFilterChange={setFilterQuery}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          {diffData ? (
            <DiffViewer
              patch={diffData.patch}
              layout={layout}
              comments={comments}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              selectedFileId={selectedFile}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-[#8b949e] text-sm animate-pulse">
                Loading diff…
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Keyboard shortcuts hint */}
      <footer className="border-t border-white/5 px-4 py-1 text-[10px] text-[#8b949e] flex gap-4">
        <span><kbd className="font-mono">j/k</kbd> navigate files</span>
        <span><kbd className="font-mono">s</kbd> toggle split</span>
        <span><kbd className="font-mono">/</kbd> filter</span>
        <span><kbd className="font-mono">r</kbd> refresh</span>
        <span><kbd className="font-mono">+</kbd> comment</span>
      </footer>
    </div>
  );
}
