/**
 * PURPOSE: Creates the content for AGENTS.md directing the agent to read CLAUDE.md for project context
 *
 * USAGE:
 * const content = agentsMdCreatorTransformer();
 * // Returns FileContents branded string
 *
 * CONTRACTS: Output: FileContents (branded string)
 */

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';

export const agentsMdCreatorTransformer = (): FileContents =>
  fileContentsContract.parse(
    '# Agent Guidelines\n\nGo read [CLAUDE.md](file://./CLAUDE.md) to get context on the project and repo before doing any other exploratory work.\n\n## Antigravity MCP Calling\n\nAll Dungeonmaster MCP tools (`get-project-map`, `discover`, `get-architecture`, `run-ward`, etc.) are available via `call_mcp_tool` under server `dungeonmaster_dungeonmaster`.\n',
  );
