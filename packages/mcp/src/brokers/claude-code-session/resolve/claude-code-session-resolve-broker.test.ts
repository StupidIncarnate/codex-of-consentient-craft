import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { claudeCodeSessionResolveBroker } from './claude-code-session-resolve-broker';
import { claudeCodeSessionResolveBrokerProxy } from './claude-code-session-resolve-broker.proxy';

describe('claudeCodeSessionResolveBroker', () => {
  it('VALID: {one jsonl in sessions dir} => returns its sessionId and full path', async () => {
    const proxy = claudeCodeSessionResolveBrokerProxy();
    proxy.setupHomedir({ homedir: '/home/u' });
    proxy.setupSessionsDir({
      entries: [{ name: 'abc-123.jsonl', mtimeMs: 5000 }],
    });

    const result = await claudeCodeSessionResolveBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/u/project' }),
    });

    expect(result).toStrictEqual({
      sessionId: 'abc-123',
      sessionFilePath: '/home/u/.claude/projects/-home-u-project/abc-123.jsonl',
    });
  });

  it('VALID: {multiple jsonls} => picks the one with the highest mtimeMs', async () => {
    const proxy = claudeCodeSessionResolveBrokerProxy();
    proxy.setupHomedir({ homedir: '/home/u' });
    proxy.setupSessionsDir({
      entries: [
        { name: 'older.jsonl', mtimeMs: 1000 },
        { name: 'newer.jsonl', mtimeMs: 9000 },
        { name: 'mid.jsonl', mtimeMs: 5000 },
      ],
    });

    const result = await claudeCodeSessionResolveBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/u/project' }),
    });

    expect(result).toStrictEqual({
      sessionId: 'newer',
      sessionFilePath: '/home/u/.claude/projects/-home-u-project/newer.jsonl',
    });
  });

  it('VALID: {jsonl mixed with non-jsonl entries} => filters out non-jsonl', async () => {
    const proxy = claudeCodeSessionResolveBrokerProxy();
    proxy.setupHomedir({ homedir: '/home/u' });
    proxy.setupSessionsDir({
      entries: [
        { name: 'README.md', mtimeMs: 9999 },
        { name: 'subagents', mtimeMs: 9999 },
        { name: 'abc-123.jsonl', mtimeMs: 5000 },
      ],
    });

    const result = await claudeCodeSessionResolveBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/u/project' }),
    });

    expect(result).toStrictEqual({
      sessionId: 'abc-123',
      sessionFilePath: '/home/u/.claude/projects/-home-u-project/abc-123.jsonl',
    });
  });

  it('EMPTY: {sessions dir does not exist} => returns undefined', async () => {
    const proxy = claudeCodeSessionResolveBrokerProxy();
    proxy.setupHomedir({ homedir: '/home/u' });
    proxy.setupSessionsDirMissing();

    const result = await claudeCodeSessionResolveBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/u/project' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {sessions dir exists but has no jsonl files} => returns undefined', async () => {
    const proxy = claudeCodeSessionResolveBrokerProxy();
    proxy.setupHomedir({ homedir: '/home/u' });
    proxy.setupSessionsDir({ entries: [{ name: 'README.md', mtimeMs: 1 }] });

    const result = await claudeCodeSessionResolveBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/u/project' }),
    });

    expect(result).toBe(undefined);
  });
});
