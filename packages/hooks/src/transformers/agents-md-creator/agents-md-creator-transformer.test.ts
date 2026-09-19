import { agentsMdCreatorTransformer } from './agents-md-creator-transformer';

describe('agentsMdCreatorTransformer', () => {
  it('VALID: creates AGENTS.md content => directs agent to read CLAUDE.md and mentions Antigravity MCP', () => {
    const result = agentsMdCreatorTransformer();

    expect(result).toBe(
      '# Agent Guidelines\n\nGo read [CLAUDE.md](file://./CLAUDE.md) to get context on the project and repo before doing any other exploratory work.\n\n## Antigravity MCP Calling\n\nAll Dungeonmaster MCP tools (`get-project-map`, `discover`, `get-architecture`, `run-ward`, etc.) are available via `call_mcp_tool` under server `dungeonmaster_dungeonmaster`.\n',
    );
  });
});
