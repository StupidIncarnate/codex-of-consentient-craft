# Agent Guidelines

Go read [CLAUDE.md](file://./CLAUDE.md) to get context on the project and repo before doing any other exploratory work.

## MANDATORY: Full Ward Before Merging to Master

**NEVER merge any branch or worktree into `master` without running a bare `npm run ward` (unscoped, whole repo) and confirming it exits 0.**
- Flags `--committed`, `--uncommitted`, and file-scoped paths (`-- <files>`) are for rapid development and intermediate checks ONLY.
- They do NOT prove the monorepo is clean. A merge into `master` requires a full, bare `npm run ward` pass with 0 errors across all packages.
- Zero tolerance: An agent working directly for the user owns every failure in a full run, including pre-existing or cross-package breakages.

## Antigravity MCP Calling

All Dungeonmaster MCP tools (`get-project-map`, `discover`, `get-architecture`, `get-next-step`, etc.) are available via `call_mcp_tool` under server `dungeonmaster_dungeonmaster`.
