import { hookFsWritePathExtractTransformer } from './hook-fs-write-path-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('hookFsWritePathExtractTransformer', () => {
  describe('fs write with string literal path', () => {
    it("VALID: {writeFileSync('.claude/settings.json', ...)} => returns the path", () => {
      const source = ContentTextStub({
        value: `writeFileSync('.claude/settings.json', JSON.stringify(settings));`,
      });

      const result = hookFsWritePathExtractTransformer({ source });

      expect(result).toBe('.claude/settings.json');
    });

    it('VALID: {appendFile with double-quote path} => returns the path', () => {
      const source = ContentTextStub({
        value: `await appendFile(".dungeonmaster/quest.jsonl", line);`,
      });

      const result = hookFsWritePathExtractTransformer({ source });

      expect(result).toBe('.dungeonmaster/quest.jsonl');
    });
  });

  describe('fs write without literal path argument', () => {
    it('VALID: {writeFile(computedPath, ...)} => returns (file)', () => {
      const source = ContentTextStub({ value: `await writeFile(resolvedPath, content);` });

      const result = hookFsWritePathExtractTransformer({ source });

      expect(result).toBe('(file)');
    });
  });

  describe('no fs-write call', () => {
    it('EMPTY: {source without write calls} => returns undefined', () => {
      const source = ContentTextStub({
        value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
      });

      const result = hookFsWritePathExtractTransformer({ source });

      expect(result).toBe(undefined);
    });
  });
});
