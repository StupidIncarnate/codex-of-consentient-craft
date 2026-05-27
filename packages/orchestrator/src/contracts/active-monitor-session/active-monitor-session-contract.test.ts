import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../iso-timestamp/iso-timestamp.stub';
import { activeMonitorSessionContract } from './active-monitor-session-contract';

describe('activeMonitorSessionContract', () => {
  it('VALID: {projectDir, sessionFilePath, registeredAt} => parses', () => {
    const projectDir = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj',
    });
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc.jsonl',
    });
    const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });

    const result = activeMonitorSessionContract.parse({
      projectDir,
      sessionFilePath,
      registeredAt,
    });

    expect(result).toStrictEqual({ projectDir, sessionFilePath, registeredAt });
  });

  it('INVALID: {empty projectDir} => throws', () => {
    expect(() =>
      activeMonitorSessionContract.parse({
        projectDir: '',
        sessionFilePath: '/home/user/foo.jsonl',
        registeredAt: '2026-05-13T10:00:00.000Z',
      }),
    ).toThrow(/at least 1/u);
  });

  it('INVALID: {non-iso registeredAt} => throws', () => {
    expect(() =>
      activeMonitorSessionContract.parse({
        projectDir: '/home/user/.claude/projects/-home-user-proj',
        sessionFilePath: '/home/user/.claude/projects/-home-user-proj/abc.jsonl',
        registeredAt: 'not-a-date',
      }),
    ).toThrow(/datetime/u);
  });
});
