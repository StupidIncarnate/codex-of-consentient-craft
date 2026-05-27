import { FilePathStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetMonitorSessionAdapter } from './orchestrator-get-monitor-session-adapter';
import { orchestratorGetMonitorSessionAdapterProxy } from './orchestrator-get-monitor-session-adapter.proxy';

describe('orchestratorGetMonitorSessionAdapter', () => {
  it('VALID: {orchestrator returns registered session} => returns the session', () => {
    const proxy = orchestratorGetMonitorSessionAdapterProxy();
    const sessionId = SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' });
    const projectDir = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj',
    });
    proxy.returns({ session: { sessionId, projectDir } });

    const result = orchestratorGetMonitorSessionAdapter();

    expect(result).toStrictEqual({ sessionId, projectDir });
  });

  it('EMPTY: {orchestrator returns null} => returns null', () => {
    const proxy = orchestratorGetMonitorSessionAdapterProxy();
    proxy.returns({ session: null });

    const result = orchestratorGetMonitorSessionAdapter();

    expect(result).toBe(null);
  });
});
