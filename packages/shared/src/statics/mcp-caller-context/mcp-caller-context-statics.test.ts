import { mcpCallerContextStatics } from './mcp-caller-context-statics';

describe('mcpCallerContextStatics', () => {
  it('VALID: {statics} => carries the argument key, the meta key and the hook matcher', () => {
    expect(mcpCallerContextStatics).toStrictEqual({
      keys: {
        argument: 'dungeonmasterCaller',
        meta: 'dungeonmaster/caller',
      },
      hook: {
        matcher: 'mcp__dungeonmaster__.*',
      },
    });
  });
});
