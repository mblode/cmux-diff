#!/usr/bin/env node
import { program } from "commander";
import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { resolve, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);

program
  .name("cmux-diff")
  .description("GitHub PR-style local diff viewer for cmux")
  .version("0.1.0")
  .option("-p, --port <port>", "Port to serve on", "2047")
  .option("-r, --repo <path>", "Git repository path (defaults to cwd)")
  .option("-b, --base <branch>", "Base branch to diff against (defaults to main/master)")
  .option("--no-open", "Don't open browser automatically")
  .parse(process.argv);

const opts = program.opts();
const port = opts.port;
const repoPath = resolve(opts.repo ?? process.cwd());
const baseBranch = opts.base ?? "";

// Verify it's a git repo
if (!existsSync(join(repoPath, ".git"))) {
  console.error(`❌ Not a git repository: ${repoPath}`);
  process.exit(1);
}

console.log(`🔍 cmux-diff`);
console.log(`   Repo:  ${repoPath}`);
console.log(`   Port:  ${port}`);
if (baseBranch) console.log(`   Base:  ${baseBranch}`);
console.log("");

// Set env vars
process.env.CMUX_DIFF_REPO = repoPath;
if (baseBranch) process.env.CMUX_DIFF_BASE = baseBranch;
process.env.PORT = port;

// Find the Next.js app directory (relative to this bin file)
const appDir = resolve(__dirname, "..");

// Start Next.js
const nextBin = join(appDir, "node_modules", ".bin", "next");
const nextBinFallback = join(appDir, "..", "..", "node_modules", ".bin", "next");
const next = existsSync(nextBin) ? nextBin : nextBinFallback;

const server = spawn(next, ["start", "--port", port], {
  cwd: appDir,
  env: {
    ...process.env,
    CMUX_DIFF_REPO: repoPath,
    ...(baseBranch ? { CMUX_DIFF_BASE: baseBranch } : {}),
    NODE_ENV: "production",
  },
  stdio: "inherit",
});

server.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

const url = `http://localhost:${port}`;

// Give the server a moment to start, then open browser
if (opts.open !== false) {
  setTimeout(() => {
    console.log(`\n   Open: ${url}\n`);
    try {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } catch {
      // ignore, macOS open might not be available
    }
  }, 2000);
}

// Graceful shutdown
process.on("SIGINT", () => {
  server.kill();
  process.exit(0);
});
