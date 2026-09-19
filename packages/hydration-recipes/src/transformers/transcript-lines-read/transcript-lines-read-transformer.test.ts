import { FileContentsStub } from '@dungeonmaster/shared/contracts';

import { transcriptLinesReadTransformer } from './transcript-lines-read-transformer';

describe('transcriptLinesReadTransformer', () => {
  describe('valid transcripts', () => {
    it('VALID: {two lines with a trailing newline} => returns both, no empty entry', () => {
      const contents = FileContentsStub({
        value: `{"uuid":"a","timestamp":"2026-01-01T00:00:00.000Z","message":{"content":"one"}}\n{"uuid":"b","timestamp":"2026-01-01T00:00:01.000Z","message":{"content":"two"}}\n`,
      });

      expect(transcriptLinesReadTransformer({ contents })).toStrictEqual([
        { uuid: 'a', timestamp: '2026-01-01T00:00:00.000Z', message: { content: 'one' } },
        { uuid: 'b', timestamp: '2026-01-01T00:00:01.000Z', message: { content: 'two' } },
      ]);
    });

    it('EMPTY: {""} => returns no lines', () => {
      expect(
        transcriptLinesReadTransformer({ contents: FileContentsStub({ value: '' }) }),
      ).toStrictEqual([]);
    });
  });

  describe('invalid transcripts', () => {
    it('INVALID: {a line with no uuid} => throws', () => {
      const contents = FileContentsStub({
        value: `{"timestamp":"2026-01-01T00:00:00.000Z","message":{"content":"one"}}\n`,
      });

      expect(() => transcriptLinesReadTransformer({ contents })).toThrow(/Required/u);
    });
  });
});
