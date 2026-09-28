import { ResolveCallerSessionLayerResponder } from './resolve-caller-session-layer-responder';
import { ResolveCallerSessionLayerResponderProxy } from './resolve-caller-session-layer-responder.proxy';

const PROJECT_DIR = '/default/cwd';
const CALLER_SESSION = 'bbbbbbbb-2222-4333-9444-555555555555';

describe('ResolveCallerSessionLayerResponder', () => {
  it('VALID: {meta carries a hook-stamped caller} => returns its session id', () => {
    ResolveCallerSessionLayerResponderProxy();

    const result = ResolveCallerSessionLayerResponder({
      meta: { 'dungeonmaster/caller': { cwd: PROJECT_DIR, sessionId: CALLER_SESSION } },
    });

    expect(result).toBe(CALLER_SESSION);
  });

  it('EMPTY: {meta: undefined} => returns undefined', () => {
    ResolveCallerSessionLayerResponderProxy();

    const result = ResolveCallerSessionLayerResponder({ meta: undefined });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {meta carries no hook-stamped caller} => returns undefined', () => {
    ResolveCallerSessionLayerResponderProxy();

    const result = ResolveCallerSessionLayerResponder({
      meta: { 'claudecode/toolUseId': 'toolu_01' },
    });

    expect(result).toBe(undefined);
  });
});
