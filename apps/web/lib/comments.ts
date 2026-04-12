import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

function getCommentsPath(): string {
  const repoPath = process.env.CMUX_DIFF_REPO ?? process.cwd();
  return join(repoPath, ".git", "cmux-diff-comments.json");
}

export type CommentTag =
  | "[must-fix]"
  | "[suggestion]"
  | "[nit]"
  | "[question]"
  | "";

export interface Comment {
  id: string;
  file: string;
  lineNumber: number;
  side: "left" | "right";
  body: string;
  tag: CommentTag;
  createdAt: string;
}

export function readComments(): Comment[] {
  const path = getCommentsPath();
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Comment[];
  } catch {
    return [];
  }
}

function saveComments(comments: Comment[]): void {
  writeFileSync(getCommentsPath(), JSON.stringify(comments, null, 2));
}

export function addComment(data: Omit<Comment, "id" | "createdAt">): Comment {
  const comments = readComments();
  const comment: Comment = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  saveComments(comments);
  return comment;
}

export function deleteComment(id: string): void {
  saveComments(readComments().filter((c) => c.id !== id));
}

