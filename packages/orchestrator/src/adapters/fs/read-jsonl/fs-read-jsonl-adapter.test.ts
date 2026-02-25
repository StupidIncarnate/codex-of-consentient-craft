import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapter } from './fs-read-jsonl-adapter';
import { fsReadJsonlAdapterProxy } from './fs-read-jsonl-adapter.proxy';

describe('fsReadJsonlAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {filePath with multiple lines} => returns array of StreamJsonLine strings', async () => {
      const proxy = fsReadJsonlAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/home/user/.claude/sessions/abc.jsonl' });
      const content = '{"type":"user","message":"hello"}\n{"type":"assistant","message":"hi"}\n';

      proxy.returns({ content });

      const result = await fsReadJsonlAdapter({ filePath });

      expect(result).toStrictEqual([
        '{"type":"user","message":"hello"}',
        '{"type":"assistant","message":"hi"}',
      ]);
    });

    it('VALID: {filePath with single line} => returns array with one line', async () => {
      const proxy = fsReadJsonlAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/home/user/.claude/sessions/single.jsonl' });
      const content = '{"type":"user","message":"only"}';

      proxy.returns({ content });

      const result = await fsReadJsonlAdapter({ filePath });

      expect(result).toStrictEqual(['{"type":"user","message":"only"}']);
    });

    it('EMPTY: {filePath with empty file} => returns empty array', async () => {
      const proxy = fsReadJsonlAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/home/user/.claude/sessions/empty.jsonl' });
      const content = '';

      proxy.returns({ content });

      const result = await fsReadJsonlAdapter({ filePath });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {filePath with blank lines between entries} => skips blank lines', async () => {
      const proxy = fsReadJsonlAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/home/user/.claude/sessions/gaps.jsonl' });
      const content = '{"a":1}\n\n{"b":2}\n  \n{"c":3}\n';

      proxy.returns({ content });

      const result = await fsReadJsonlAdapter({ filePath });

      expect(result).toStrictEqual(['{"a":1}', '{"b":2}', '{"c":3}']);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath does not exist} => throws ENOENT error', async () => {
      const proxy = fsReadJsonlAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/nonexistent/path.jsonl' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsReadJsonlAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
