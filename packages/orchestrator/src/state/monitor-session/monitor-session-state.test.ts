import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { monitorSessionState } from './monitor-session-state';

describe('monitorSessionState', () => {
  it('EMPTY: {fresh state} => isRegistered is false and get returns null', () => {
    monitorSessionState.clear();

    expect(monitorSessionState.isRegistered()).toBe(false);
    expect(monitorSessionState.get()).toBe(null);
  });

  it('VALID: {register called} => stores projectDir, sessionFilePath, registeredAt', () => {
    monitorSessionState.clear();
    const projectDir = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-project',
    });
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-project/abc-123.jsonl',
    });
    const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });

    monitorSessionState.register({ projectDir, sessionFilePath, registeredAt });

    expect(monitorSessionState.isRegistered()).toBe(true);
    expect(monitorSessionState.get()).toStrictEqual({
      projectDir,
      sessionFilePath,
      registeredAt,
    });
  });

  it('VALID: {register then clear} => isRegistered is false again', () => {
    monitorSessionState.clear();
    const projectDir = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-project',
    });
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-project/abc-123.jsonl',
    });
    const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
    monitorSessionState.register({ projectDir, sessionFilePath, registeredAt });

    monitorSessionState.clear();

    expect(monitorSessionState.isRegistered()).toBe(false);
    expect(monitorSessionState.get()).toBe(null);
  });
});
