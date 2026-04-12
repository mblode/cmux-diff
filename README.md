# cmux-diff 2

GitHub PR-style diff viewer for cmux and AI coding agents.

Shows `git diff main...HEAD` — all changes since branching from main — in a split or unified view with inline AI review comments, an "Open in" context menu, and live auto-refresh.

## Features

- **PR-style diff** — diffs against the merge-base of your base branch, matching GitHub's "Files Changed" view exactly
- **Split and unified views** — toggle with `s`, keyboard-navigable with `j` / `k`
- **Inline AI comments** — add `[must-fix]`, `[suggestion]`, `[nit]`, or `[question]` notes on any diff line; copy all comments as a formatted prompt
- **"Open in" context menu** — right-click any file to open in Zed, VS Code, Ghostty, Terminal, Finder, or copy the path
- **Live refresh** — polls for changes every 5 seconds; manual refresh with `r`
- **File sidebar** — filter files with `/`, see per-file `+`/`-` stats at a glance

## Install

```bash
npm install -g cmux-diff
```

Or run without installing:

```bash
npx cmux-diff
```

## Usage

Run inside any git repository:

```bash
cmux-diff
```

Opens `http://localhost:2047` and shows all changes between your current branch and `main` (or `master` / `develop`, auto-detected).

```bash
# Use a different base branch
cmux-diff --base develop

# Point at a repo in another directory
cmux-diff --repo ~/projects/my-app

# Use a different port
cmux-diff --port 3000

# Don't open the browser automatically
cmux-diff --no-open
```

### Keyboard shortcuts

| Key       | Action                      |
| --------- | --------------------------- |
| `j` / `k` | Next / previous file        |
| `s`       | Toggle split / unified view |
| `/`       | Focus file filter           |
| `r`       | Refresh diff                |

## Options

| Flag                  | Default | Description                 |
| --------------------- | ------- | --------------------------- |
| `-p, --port <port>`   | `2047`  | Port to serve on            |
| `-r, --repo <path>`   | `cwd`   | Path to the git repository  |
| `-b, --base <branch>` | auto    | Base branch to diff against |
| `--no-open`           | —       | Skip automatic browser open |

## Requirements

- Node.js 18+
- A git repository with at least one commit on your current branch
- The project must be built before running (`npm run build` inside `apps/web`)

## License

MIT
