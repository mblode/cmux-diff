"use client";

import { useEffect, useRef } from "react";
import { FolderOpenIcon, CodeLinesIcon, CodeBracketsIcon, CopySimpleIcon, CheckIcon } from "blode-icons-react";
import { useState } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  filePath: string;
  repoPath: string;
  onClose: () => void;
}

const APPS = [
  { key: "finder", label: "Finder", icon: FolderOpenIcon },
  { key: "zed", label: "Zed", icon: CodeLinesIcon },
  { key: "vscode", label: "VS Code", icon: CodeLinesIcon },
  { key: "xcode", label: "Xcode", icon: CodeLinesIcon },
  { key: "ghostty", label: "Ghostty", icon: CodeBracketsIcon },
  { key: "terminal", label: "Terminal", icon: CodeBracketsIcon },
] as const;

type AppKey = (typeof APPS)[number]["key"];

export function ContextMenu({
  x,
  y,
  filePath,
  repoPath,
  onClose,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  async function openIn(app: AppKey) {
    const fullPath = `${repoPath}/${filePath}`;
    await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: fullPath, app }),
    });
    onClose();
  }

  async function copyPath() {
    const fullPath = `${repoPath}/${filePath}`;
    await navigator.clipboard.writeText(fullPath);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  }

  // Adjust position to stay in viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 200),
    zIndex: 1000,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="min-w-[160px] rounded-lg border border-white/10 bg-[#1c2128] shadow-xl py-1 text-sm"
    >
      {/* File path header */}
      <div className="px-3 py-1.5 text-xs text-[#8b949e] border-b border-white/10 mb-1 font-mono truncate max-w-[200px]">
        {filePath.split("/").pop()}
      </div>

      {APPS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => openIn(key)}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[#e6edf3] hover:bg-white/5 transition-colors"
        >
          <Icon size={14} className="text-[#8b949e]" />
          {label}
        </button>
      ))}

      <div className="border-t border-white/10 mt-1 pt-1">
        <button
          onClick={copyPath}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[#e6edf3] hover:bg-white/5 transition-colors"
        >
          {copied ? (
            <CheckIcon size={14} className="text-[#3fb950]" />
          ) : (
            <CopySimpleIcon size={14} className="text-[#8b949e]" />
          )}
          {copied ? "Copied!" : "Copy path"}
        </button>
      </div>
    </div>
  );
}
