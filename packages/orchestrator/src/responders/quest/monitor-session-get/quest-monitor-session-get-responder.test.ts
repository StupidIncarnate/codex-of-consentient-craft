import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';

import { QuestMonitorSessionGetResponder } from './quest-monitor-session-get-responder';
import { QuestMonitorSessionGetResponderProxy } from './quest-monitor-session-get-responder.proxy';

describe('QuestMonitorSessionGetResponder', () => {
  it('EMPTY: {no session registered} => returns null', () => {
    const proxy = QuestMonitorSessionGetResponderProxy();
    proxy.setupNoSession();

    const result = QuestMonitorSessionGetResponder();

    expect(result).toBe(null);
  });

  it('VALID: {session registered with standard sessionFilePath shape} => returns sessionId derived from basename + projectDir from state', () => {
    const proxy = QuestMonitorSessionGetResponderProxy();
    const projectDir = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj',
    });
    proxy.setupRegistered({
      projectDir,
      sessionFilePath: FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      }),
      registeredAt: IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' }),
    });

    const result = QuestMonitorSessionGetResponder();

    expect(result).toStrictEqual({
      sessionId: 'abc-123',
      projectDir,
    });
  });

  it('VALID: {session registered with UUID-format sessionId in file path} => returns the UUID as sessionId', () => {
    const proxy = QuestMonitorSessionGetResponderProxy();
    const projectDir = FilePathStub({
      value: '/home/u/.claude/projects/-home-u-x',
    });
    proxy.setupRegistered({
      projectDir,
      sessionFilePath: FilePathStub({
        value: '/home/u/.claude/projects/-home-u-x/c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl',
      }),
      registeredAt: IsoTimestampStub({ value: '2026-05-26T19:21:00.000Z' }),
    });

    const result = QuestMonitorSessionGetResponder();

    expect(result).toStrictEqual({
      sessionId: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671',
      projectDir,
    });
  });
});
