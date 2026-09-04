import { recordToFlatTextTransformer } from './record-to-flat-text-transformer';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { digestDefaultStatics } from '../../statics/digest-default/digest-default-statics';

describe('recordToFlatTextTransformer', () => {
  describe('single block', () => {
    it('VALID: {content: one text block} => returns that text', () => {
      const record = TranscriptRecordStub({
        message: { content: [{ type: 'text', text: 'Reading the file now.' }] },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('Reading the file now.');
    });
  });

  describe('multiple blocks, order preserved', () => {
    it('VALID: {content: text then thinking} => both joined by newline, text first', () => {
      const record = TranscriptRecordStub({
        message: {
          content: [
            { type: 'text', text: 'Reading the file now.' },
            { type: 'thinking', thinking: 'Considering the approach.' },
          ],
        },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('Reading the file now.\n[thinking] Considering the approach.');
    });

    it('VALID: {content: thinking then text} => both joined by newline, thinking first', () => {
      const record = TranscriptRecordStub({
        message: {
          content: [
            { type: 'thinking', thinking: 'Considering the approach.' },
            { type: 'text', text: 'Reading the file now.' },
          ],
        },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('[thinking] Considering the approach.\nReading the file now.');
    });

    it('VALID: {content: text, tool_use, text} => tool_use ignored, texts joined', () => {
      const record = TranscriptRecordStub({
        message: {
          content: [
            { type: 'text', text: 'First half.' },
            { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } },
            { type: 'text', text: 'Second half.' },
          ],
        },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('First half.\nSecond half.');
    });
  });

  describe('thinking truncation', () => {
    it('EDGE: {thinking longer than thinkingChars} => truncated to exactly that length, prefix included but not counted', () => {
      const longThinking = 'a'.repeat(digestDefaultStatics.thinkingExcerptChars + 50);
      const record = TranscriptRecordStub({
        message: { content: [{ type: 'thinking', thinking: longThinking }] },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe(
        `[thinking] ${'a'.repeat(digestDefaultStatics.thinkingExcerptChars)}`,
      );
    });

    it('EDGE: {thinkingChars: 5} => truncation honours the explicit value', () => {
      const record = TranscriptRecordStub({
        message: {
          content: [{ type: 'thinking', thinking: 'Considering the approach in depth.' }],
        },
      });

      const result = recordToFlatTextTransformer({ record, thinkingChars: 5 });

      expect(String(result)).toBe('[thinking] Consi');
    });
  });

  describe('blocks missing their own field', () => {
    it('EDGE: {content: text block with no text field, then a text block with text} => the empty one is skipped, no blank line', () => {
      const record = TranscriptRecordStub({
        message: {
          content: [{ type: 'text' }, { type: 'text', text: 'Only this survives.' }],
        },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('Only this survives.');
    });

    it('EDGE: {content: thinking block with no thinking field, then a text block} => the empty one is skipped', () => {
      const record = TranscriptRecordStub({
        message: {
          content: [{ type: 'thinking' }, { type: 'text', text: 'Only this survives.' }],
        },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('Only this survives.');
    });
  });

  describe('empty input', () => {
    it("EMPTY: {no message} => returns ''", () => {
      const record = TranscriptRecordStub({ type: 'attachment', message: undefined });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('');
    });

    it("EMPTY: {content: only tool_use blocks} => returns ''", () => {
      const record = TranscriptRecordStub({
        message: {
          content: [
            { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } },
            { type: 'tool_use', name: 'Grep', input: { pattern: 'foo' } },
          ],
        },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('');
    });
  });

  describe('bare-string content', () => {
    it('VALID: {content: bare string} => returns that string', () => {
      const record = TranscriptRecordStub({
        type: 'user',
        message: { content: 'What does this function return?' },
      });

      const result = recordToFlatTextTransformer({ record });

      expect(String(result)).toBe('What does this function return?');
    });
  });
});
