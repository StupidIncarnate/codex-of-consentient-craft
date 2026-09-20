import { dmJsonlAppendAdapter } from './dm-jsonl-append-adapter';
import { dmJsonlAppendAdapterProxy } from './dm-jsonl-append-adapter.proxy';
import { AbsoluteFilePathStub, StreamJsonLineStub } from '@dungeonmaster/shared/contracts';

describe('dmJsonlAppendAdapter', () => {
  describe('successful appends', () => {
    it('VALID: {two lines} => joins them newline-terminated and appends after creating the directory', async () => {
      const proxy = dmJsonlAppendAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/tmp/guild-1/.claude/projects/enc/seed-session-1.jsonl',
      });
      proxy.succeeds({ filePath });

      const result = await dmJsonlAppendAdapter({
        filePath,
        lines: [StreamJsonLineStub({ value: '{"a":1}' }), StreamJsonLineStub({ value: '{"a":2}' })],
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAppendedContents({ filePath })).toBe('{"a":1}\n{"a":2}\n');
    });

    it('VALID: {one line} => appends a single newline-terminated line', async () => {
      const proxy = dmJsonlAppendAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/guild-2/agent-seed-agent-1.jsonl' });
      proxy.succeeds({ filePath });

      await dmJsonlAppendAdapter({ filePath, lines: [StreamJsonLineStub({ value: '{"b":1}' })] });

      expect(proxy.getAppendedContents({ filePath })).toBe('{"b":1}\n');
    });
  });
});
