import { extractSessionFileSummaryTransformer } from './extract-session-file-summary-transformer';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

describe('extractSessionFileSummaryTransformer', () => {
  describe('last line summary', () => {
    it('VALID: {fileContent: summary on last line} => extracts summary from last line', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value:
            '{"type":"assistant","message":"hi"}\n{"type":"summary","summary":"Built login page"}',
        }),
      });

      expect(result).toBe('Built login page');
    });
  });

  describe('first line summary', () => {
    it('VALID: {fileContent: summary on first line} => extracts summary from first line', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value:
            '{"type":"summary","summary":"Fixed auth bug"}\n{"type":"assistant","message":"done"}',
        }),
      });

      expect(result).toBe('Fixed auth bug');
    });
  });

  describe('slug fallback', () => {
    it('VALID: {fileContent: slug on early line} => extracts slug as summary', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value:
            '{"type":"user","slug":"dapper-napping-lightning"}\n{"type":"assistant","message":"hi"}',
        }),
      });

      expect(result).toBe('dapper-napping-lightning');
    });
  });

  describe('user message fallback', () => {
    it('VALID: {fileContent: no summary or slug but has user message} => falls back to first user message', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value:
            '{"type":"assistant","message":{"role":"assistant","content":"hello"}}\n{"type":"user","message":{"role":"user","content":"Help me build a login page"}}',
        }),
      });

      expect(result).toBe('Help me build a login page');
    });
  });

  describe('no summary', () => {
    it('VALID: {fileContent: no summary, no slug, no valid user message} => returns undefined', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value:
            '{"type":"assistant","message":{"role":"assistant","content":"hello"}}\n{"type":"assistant","message":{"role":"assistant","content":"how can I help"}}',
        }),
      });

      expect(result).toBeUndefined();
    });

    it('VALID: {fileContent: empty string} => returns undefined', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({ value: '' }),
      });

      expect(result).toBeUndefined();
    });
  });
});
