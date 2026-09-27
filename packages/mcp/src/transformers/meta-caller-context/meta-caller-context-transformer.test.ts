import { metaCallerContextTransformer } from './meta-caller-context-transformer';

describe('metaCallerContextTransformer', () => {
  it('VALID: {meta with a caller} => returns the caller', () => {
    const result = metaCallerContextTransformer({
      meta: {
        'claudecode/toolUseId': 'toolu_1',
        'dungeonmaster/caller': {
          cwd: '/repo/worktrees/x',
          sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          agentId: 'a493e1c2168b46114',
        },
      },
    });

    expect(result).toStrictEqual({
      cwd: '/repo/worktrees/x',
      sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      agentId: 'a493e1c2168b46114',
    });
  });

  it('EMPTY: {meta without a caller} => returns undefined', () => {
    expect(metaCallerContextTransformer({ meta: { 'claudecode/toolUseId': 'toolu_1' } })).toBe(
      undefined,
    );
  });

  it('EMPTY: {meta: undefined} => returns undefined', () => {
    expect(metaCallerContextTransformer({ meta: undefined })).toBe(undefined);
  });

  it('INVALID: {caller missing its sessionId} => returns undefined', () => {
    expect(
      metaCallerContextTransformer({ meta: { 'dungeonmaster/caller': { cwd: '/repo' } } }),
    ).toBe(undefined);
  });
});
