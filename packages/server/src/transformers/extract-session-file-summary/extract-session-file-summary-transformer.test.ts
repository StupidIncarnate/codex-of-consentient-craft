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

  describe('invalid JSON fallthrough', () => {
    it('EDGE: {fileContent: invalid JSON on last line, summary on first} => falls through to first line', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value: '{"type":"summary","summary":"First line summary"}\nnot valid json',
        }),
      });

      expect(result).toBe('First line summary');
    });

    it('EDGE: {fileContent: invalid JSON on both last and first line} => falls through to slug scan', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value: [
            'not valid json first',
            '{"type":"user","slug":"fallback-slug"}',
            'not valid json last',
          ].join('\n'),
        }),
      });

      expect(result).toBe('fallback-slug');
    });
  });

  describe('empty slug skipped', () => {
    it('EDGE: {fileContent: empty slug string} => skips empty slug and falls through', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"user","slug":""}',
            '{"type":"user","message":{"role":"user","content":"fallback user message"}}',
          ].join('\n'),
        }),
      });

      expect(result).toBe('fallback user message');
    });
  });

  describe('slug scan limit', () => {
    it('EDGE: {fileContent: slug on line 6} => does not find slug beyond scan limit of 5', () => {
      const result = extractSessionFileSummaryTransformer({
        fileContent: FileContentsStub({
          value: [
            '{"type":"assistant","message":"line1"}',
            '{"type":"assistant","message":"line2"}',
            '{"type":"assistant","message":"line3"}',
            '{"type":"assistant","message":"line4"}',
            '{"type":"assistant","message":"line5"}',
            '{"type":"user","slug":"too-far-slug"}',
          ].join('\n'),
        }),
      });

      expect(result).toBeUndefined();
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
