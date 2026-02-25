import { stripJsonlSuffixTransformer } from './strip-jsonl-suffix-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('stripJsonlSuffixTransformer', () => {
  describe('suffix removal', () => {
    it('VALID: {filePath: "/home/user/.claude/session.jsonl"} => strips .jsonl suffix', () => {
      const result = stripJsonlSuffixTransformer({
        filePath: AbsoluteFilePathStub({ value: '/home/user/.claude/session.jsonl' }),
      });

      expect(result).toBe('/home/user/.claude/session');
    });

    it('VALID: {filePath: "/tmp/data/export.jsonl"} => strips .jsonl from deeply nested path', () => {
      const result = stripJsonlSuffixTransformer({
        filePath: AbsoluteFilePathStub({ value: '/tmp/data/export.jsonl' }),
      });

      expect(result).toBe('/tmp/data/export');
    });

    it('VALID: {filePath: "/home/user/file.jsonl.bak"} => does not strip .jsonl when not at end', () => {
      const result = stripJsonlSuffixTransformer({
        filePath: AbsoluteFilePathStub({ value: '/home/user/file.jsonl.bak' }),
      });

      expect(result).toBe('/home/user/file.jsonl.bak');
    });
  });
});
