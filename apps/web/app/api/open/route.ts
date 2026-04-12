import { exec } from "child_process";
import path from "path";
import { NextResponse } from "next/server";

type AppKey = "finder" | "zed" | "vscode" | "xcode" | "ghostty" | "terminal";

function buildCommand(app: AppKey, filePath: string, line?: number): string {
  switch (app) {
    case "finder":
      return `open -R "${filePath}"`;
    case "zed":
      return line ? `zed "${filePath}:${line}"` : `zed "${filePath}"`;
    case "vscode":
      return line
        ? `code --goto "${filePath}:${line}"`
        : `code "${filePath}"`;
    case "xcode":
      return `xed "${filePath}"`;
    case "ghostty":
      return `open -a Ghostty`;
    case "terminal":
      return `open -a Terminal "${path.dirname(filePath)}"`;
    default:
      throw new Error(`Unknown app: ${app}`);
  }
}

export async function POST(request: Request) {
  const {
    path: filePath,
    app,
    line,
  } = (await request.json()) as {
    path: string;
    app: AppKey;
    line?: number;
  };

  if (!filePath || !app) {
    return NextResponse.json({ error: "path and app required" }, { status: 400 });
  }

  let cmd: string;
  try {
    cmd = buildCommand(app, filePath, line);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }

  return new Promise<NextResponse>((resolve) => {
    exec(cmd, (err) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ ok: true }));
      }
    });
  });
}
