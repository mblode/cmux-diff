"use client";

import { useState } from "react";
import { BubbleDotsIcon, PlusLargeIcon } from "blode-icons-react";
import type { DiffFileStat } from "@/lib/git";
import type { Comment, CommentTag } from "@/lib/comments";
import { ContextMenu } from "./ContextMenu";

interface FileListProps {
  files: DiffFileStat[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
  comments: Comment[];
  onAddComment: (
    file: string,
    lineNumber: number,
    body: string,
    tag: CommentTag
  ) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  repoPath: string;
  filterQuery: string;
  onFilterChange: (q: string) => void;
}

const TAGS: CommentTag[] = ["[must-fix]", "[suggestion]", "[nit]", "[question]"];
const TAG_COLORS: Record<string, string> = {
  "[must-fix]": "text-[#f85149] bg-[#f85149]/10",
  "[suggestion]": "text-[#3fb950] bg-[#3fb950]/10",
  "[nit]": "text-[#8b949e] bg-white/5",
  "[question]": "text-[#d2a8ff] bg-[#d2a8ff]/10",
};

interface AddCommentFormProps {
  file: string;
  onSubmit: (lineNumber: number, body: string, tag: CommentTag) => void;
  onCancel: () => void;
}

function AddCommentForm({ file, onSubmit, onCancel }: AddCommentFormProps) {
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<CommentTag>("[suggestion]");
  const [lineNumber, setLineNumber] = useState(0);

  function handleSubmit() {
    if (!body.trim()) return;
    onSubmit(lineNumber, body.trim(), tag);
    setBody("");
  }

  return (
    <div className="mt-1 rounded-md border border-white/10 bg-[#0d1117] p-2">
      <div className="text-[10px] text-[#8b949e] font-mono mb-1.5 truncate">
        {file.split("/").pop()}
      </div>
      {/* Tag selector */}
      <div className="flex flex-wrap gap-1 mb-2">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setTag(t)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
              tag === t
                ? TAG_COLORS[t]
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {/* Line number */}
      <input
        type="number"
        placeholder="Line # (optional)"
        value={lineNumber || ""}
        onChange={(e) => setLineNumber(Number(e.target.value))}
        className="mb-1.5 w-full rounded bg-[#161b22] border border-white/10 px-2 py-1 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#388bfd]/50"
      />
      {/* Textarea */}
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment for the AI"
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        className="w-full resize-none rounded bg-[#161b22] border border-white/10 px-2 py-1.5 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#388bfd]/50"
      />
      <div className="mt-1.5 flex justify-end gap-1.5">
        <button
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!body.trim()}
          className="rounded bg-[#238636] px-2 py-1 text-xs text-white hover:bg-[#2ea043] transition-colors disabled:opacity-40"
        >
          Comment ↵
        </button>
      </div>
    </div>
  );
}

export function FileList({
  files,
  selectedFile,
  onSelectFile,
  comments,
  onAddComment,
  onDeleteComment,
  repoPath,
  filterQuery,
  onFilterChange,
}: FileListProps) {
  const [addingCommentFor, setAddingCommentFor] = useState<string | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: string;
  } | null>(null);

  const filtered = filterQuery
    ? files.filter((f) =>
        f.file.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : files;

  function getFileComments(file: string) {
    return comments.filter((c) => c.file === file);
  }

  async function handleAddComment(
    file: string,
    lineNumber: number,
    body: string,
    tag: CommentTag
  ) {
    await onAddComment(file, lineNumber, body, tag);
    setAddingCommentFor(null);
    setExpandedFile(file);
  }

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-white/10 bg-[#0d1117]">
      {/* Filter */}
      <div className="border-b border-white/10 p-2">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Filter files…"
          className="w-full rounded bg-[#161b22] border border-white/10 px-2.5 py-1.5 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#388bfd]/50"
        />
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-[#8b949e]">
            No changes relative to main
          </div>
        )}

        {filtered.map((fileStat) => {
          const fileComments = getFileComments(fileStat.file);
          const isSelected = selectedFile === fileStat.file;
          const isExpanded = expandedFile === fileStat.file;

          return (
            <div key={fileStat.file}>
              {/* File row */}
              <div
                className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#1f2937]"
                    : "hover:bg-white/[0.03]"
                }`}
                onClick={() => {
                  onSelectFile(fileStat.file);
                  if (fileComments.length > 0) {
                    setExpandedFile(isExpanded ? null : fileStat.file);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, file: fileStat.file });
                }}
              >
                {/* Stats */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: Math.min(fileStat.insertions + fileStat.deletions, 5) }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-[7px] h-[7px] rounded-sm ${
                        i < Math.round((fileStat.insertions / (fileStat.insertions + fileStat.deletions || 1)) * 5)
                          ? "bg-[#3fb950]"
                          : "bg-[#f85149]"
                      }`}
                    />
                  ))}
                </div>

                {/* Filename */}
                <span className="flex-1 min-w-0 font-mono text-[11px] text-[#e6edf3] truncate">
                  {fileStat.file.split("/").pop()}
                  <span className="text-[#8b949e] text-[10px] ml-0.5">
                    {fileStat.file.includes("/") &&
                      ` ${fileStat.file.substring(0, fileStat.file.lastIndexOf("/"))}`}
                  </span>
                </span>

                {/* Comment count */}
                {fileComments.length > 0 && (
                  <span className="flex items-center gap-0.5 shrink-0 text-[10px] text-[#8b949e]">
                    <BubbleDotsIcon size={10} />
                    {fileComments.length}
                  </span>
                )}

                {/* Add comment button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingCommentFor(
                      addingCommentFor === fileStat.file ? null : fileStat.file
                    );
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/10 transition-all"
                  title="Add comment for AI"
                >
                  <PlusLargeIcon size={11} />
                </button>
              </div>

              {/* Add comment form */}
              {addingCommentFor === fileStat.file && (
                <div className="px-2 pb-1">
                  <AddCommentForm
                    file={fileStat.file}
                    onSubmit={(ln, body, tag) =>
                      handleAddComment(fileStat.file, ln, body, tag)
                    }
                    onCancel={() => setAddingCommentFor(null)}
                  />
                </div>
              )}

              {/* Comments for file */}
              {isExpanded && fileComments.length > 0 && (
                <div className="mx-2 mb-1 space-y-1">
                  {fileComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded border border-white/10 bg-[#161b22] p-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          {comment.tag && (
                            <span
                              className={`inline-block rounded px-1 py-0.5 text-[10px] font-mono mr-1 ${TAG_COLORS[comment.tag]}`}
                            >
                              {comment.tag}
                            </span>
                          )}
                          {comment.lineNumber > 0 && (
                            <span className="text-[10px] text-[#8b949e] font-mono mr-1">
                              L{comment.lineNumber}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-[10px] text-[#8b949e] hover:text-[#f85149] shrink-0"
                        >
                          ×
                        </button>
                      </div>
                      <p className="mt-1 text-[#e6edf3] leading-relaxed">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          filePath={contextMenu.file}
          repoPath={repoPath}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  );
}
