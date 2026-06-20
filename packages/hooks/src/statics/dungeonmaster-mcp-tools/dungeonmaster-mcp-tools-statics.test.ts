import { dungeonmasterMcpToolsStatics } from './dungeonmaster-mcp-tools-statics';

describe('dungeonmasterMcpToolsStatics', () => {
  it('VALID: exported object => matches the fully-qualified MCP tool names', () => {
    expect(dungeonmasterMcpToolsStatics).toStrictEqual({
      getAgentPromptToolName: 'mcp__dungeonmaster__get-agent-prompt',
      signalBackToolName: 'mcp__dungeonmaster__signal-back',
    });
  });
});
