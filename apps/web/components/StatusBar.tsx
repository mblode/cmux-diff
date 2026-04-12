"use client";

import { BranchIcon, RotateIcon, SplitIcon, LayoutAlignLeftIcon, CopySimpleIcon, CheckIcon } from "blode-icons-react";
import { useState } from "react";
import type { Comment } from "@/lib/comments";
import { exportCommentsAsPrompt } from "@/lib/export-comments";

interface StatusBarProps {
  branch: string;
  baseBranch: string;
  insertions: number;
  deletions: number;
  fileCount: number;
  layout: "split" | "stacked";
  onLayoutToggle: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: Date | null;
  comments: Comment[];
}

export function StatusBar({
  branch,
  baseBranch,
  insertions,
  deletions,
  fileCount,
  layout,
  onLayoutToggle,
  onRefresh,
  refreshing,
  lastUpdated,
  comments,
}: StatusBarProps) {
  const [copied, setCopied] = useState(false);

  async function copyCommentsAsPrompt() {
    const text = exportCommentsAsPrompt(comments);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const timeSince = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <header className="flex items-center gap-3 border-b border-white/10 bg-[#161b22] px-4 py-2.5 text-sm">
      {/* Branch info */}
      <div className="flex items-center gap-1.5 text-[#8b949e]">
        <BranchIcon size={14} />
        <span className="text-[#e6edf3] font-mono text-xs">{branch}</span>
        <span className="text-[#8b949e]">vs</span>
        <span className="font-mono text-xs text-[#8b949e]">{baseBranch}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs font-mono text-[#8b949e]">
          {fileCount} {fileCount === 1 ? "file" : "files"} changed
        </span>
        {insertions > 0 && (
          <span className="text-xs font-mono text-[#3fb950]">+{insertions}</span>
        )}
        {deletions > 0 && (
          <span className="text-xs font-mono text-[#f85149]">−{deletions}</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Comments export */}
      {comments.length > 0 && (
        <button
          onClick={copyCommentsAsPrompt}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#8b949e] hover:bg-white/5 hover:text-[#e6edf3] transition-colors"
          title="Copy all comments as AI prompt"
        >
          {copied ? <CheckIcon size={13} /> : <CopySimpleIcon size={13} />}
          {copied ? "Copied!" : `Copy ${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
        </button>
      )}

      {/* Layout toggle */}
      <button
        onClick={onLayoutToggle}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#8b949e] hover:bg-white/5 hover:text-[#e6edf3] transition-colors"
        title={layout === "split" ? "Switch to unified" : "Switch to split"}
      >
        {layout === "split" ? <SplitIcon size={14} /> : <LayoutAlignLeftIcon size={14} />}
        {layout === "split" ? "Split" : "Unified"}
      </button>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#8b949e] hover:bg-white/5 hover:text-[#e6edf3] transition-colors disabled:opacity-40"
        title="Refresh diff"
      >
        <RotateIcon size={13} className={refreshing ? "animate-spin" : ""} />
        {timeSince !== null ? `${timeSince}s ago` : "Refresh"}
      </button>
    </header>
  );
}
