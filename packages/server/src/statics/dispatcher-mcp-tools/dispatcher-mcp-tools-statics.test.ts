import { dispatcherMcpToolsStatics } from './dispatcher-mcp-tools-statics';

describe('dispatcherMcpToolsStatics', () => {
  it('VALID: exported value => has expected dispatcher names', () => {
    expect(dispatcherMcpToolsStatics).toStrictEqual({
      names: [
        'mcp__dungeonmaster__get-next-step',
        'mcp__dungeonmaster__run-ward',
        'mcp__dungeonmaster__signal-back',
      ],
    });
  });
});
