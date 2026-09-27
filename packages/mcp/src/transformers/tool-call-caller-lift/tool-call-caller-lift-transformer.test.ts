import { toolCallCallerLiftTransformer } from './tool-call-caller-lift-transformer';

describe('toolCallCallerLiftTransformer', () => {
  it('VALID: {args carry a caller, meta carries a toolUseId} => moves the caller into meta beside it', () => {
    const result = toolCallCallerLiftTransformer({
      args: {
        glob: 'packages/*/src/**',
        dungeonmasterCaller: {
          cwd: '/repo/worktrees/x',
          sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          agentId: 'a493e1c2168b46114',
        },
      },
      meta: { 'claudecode/toolUseId': 'toolu_1', progressToken: 2 },
    });

    expect(result).toStrictEqual({
      args: { glob: 'packages/*/src/**' },
      meta: {
        'claudecode/toolUseId': 'toolu_1',
        progressToken: 2,
        'dungeonmaster/caller': {
          cwd: '/repo/worktrees/x',
          sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          agentId: 'a493e1c2168b46114',
        },
      },
    });
  });

  it('VALID: {args carry a caller, no meta} => creates meta holding the caller', () => {
    const result = toolCallCallerLiftTransformer({
      args: {
        dungeonmasterCaller: { cwd: '/repo', sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' },
      },
    });

    expect(result).toStrictEqual({
      args: {},
      meta: {
        'dungeonmaster/caller': { cwd: '/repo', sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' },
      },
    });
  });

  it('EMPTY: {no caller in args} => passes args and meta through untouched', () => {
    const result = toolCallCallerLiftTransformer({
      args: { glob: 'x' },
      meta: { 'claudecode/toolUseId': 'toolu_1' },
    });

    expect(result).toStrictEqual({
      args: { glob: 'x' },
      meta: { 'claudecode/toolUseId': 'toolu_1' },
    });
  });

  it('EMPTY: {no caller, no meta} => returns args alone', () => {
    expect(toolCallCallerLiftTransformer({ args: { glob: 'x' } })).toStrictEqual({
      args: { glob: 'x' },
    });
  });

  it('INVALID: {caller with a relative cwd} => drops it from args and keeps it out of meta', () => {
    const result = toolCallCallerLiftTransformer({
      args: { glob: 'x', dungeonmasterCaller: { cwd: 'repo', sessionId: 's' } },
      meta: { 'claudecode/toolUseId': 'toolu_1' },
    });

    expect(result).toStrictEqual({
      args: { glob: 'x' },
      meta: { 'claudecode/toolUseId': 'toolu_1' },
    });
  });
});
