import { fsAppendFileAdapter } from './fs-append-file-adapter';
import { fsAppendFileAdapterProxy } from './fs-append-file-adapter.proxy';
import { FileContentStub } from '../../../contracts/file-content/file-content.stub';

describe('fsAppendFileAdapter', () => {
  describe('successful appends', () => {
    it('VALID: {filePath, content: "a line"} => appends that content to that path', () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = '/tmp/findings.jsonl';
      const content = FileContentStub({ value: 'a line\n' });

      const result = fsAppendFileAdapter({ filePath, content });

      expect([result, proxy.getCallArgs()]).toStrictEqual([
        { success: true },
        [[filePath, content]],
      ]);
    });

    it('VALID: {two appends to one path} => both reach the file, in order', () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = '/tmp/findings.jsonl';
      const first = FileContentStub({ value: 'first\n' });
      const second = FileContentStub({ value: 'second\n' });

      fsAppendFileAdapter({ filePath, content: first });
      fsAppendFileAdapter({ filePath, content: second });

      expect(proxy.getCallArgs()).toStrictEqual([
        [filePath, first],
        [filePath, second],
      ]);
    });

    it('EMPTY: {content: ""} => still appends', () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = '/tmp/empty.jsonl';
      const content = FileContentStub({ value: '' });

      fsAppendFileAdapter({ filePath, content });

      expect(proxy.getCallArgs()).toStrictEqual([[filePath, content]]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {unwritable path} => propagates the fs error', () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = '/proc/nope.jsonl';
      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      expect(() =>
        fsAppendFileAdapter({ filePath, content: FileContentStub({ value: 'x' }) }),
      ).toThrow(/EACCES: permission denied/u);
    });
  });
});
