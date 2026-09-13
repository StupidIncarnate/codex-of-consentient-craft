import { usageLineShapeContract } from './usage-line-shape-contract';
import { UsageLineShapeStub } from './usage-line-shape.stub';

describe('usageLineShapeContract', () => {
  describe('valid input', () => {
    it('VALID: {all four counts} => parses to the complete shape', () => {
      expect(UsageLineShapeStub()).toStrictEqual({
        timestamp: '2026-09-13T04:49:29.242Z',
        message: {
          usage: {
            input_tokens: 120,
            cache_creation_input_tokens: 4_000,
            cache_read_input_tokens: 90_000,
            output_tokens: 300,
          },
        },
      });
    });

    it('EMPTY: {usage: {}} => parses, because the CLI omits a count rather than sending zero', () => {
      const result = usageLineShapeContract.safeParse({
        timestamp: '2026-09-13T04:49:29.242Z',
        message: { usage: {} },
      });

      expect(result.success).toBe(true);
    });

    it('VALID: {an explicit null count} => parses, because nullish tolerates the wire null', () => {
      const result = usageLineShapeContract.safeParse({
        timestamp: '2026-09-13T04:49:29.242Z',
        message: { usage: { input_tokens: null, output_tokens: 12 } },
      });

      expect(result.success).toBe(true);
    });

    it('VALID: {extra unknown fields} => parses, ignoring everything the scan does not read', () => {
      const result = usageLineShapeContract.safeParse({
        timestamp: '2026-09-13T04:49:29.242Z',
        type: 'assistant',
        sessionId: 'abc',
        message: { role: 'assistant', content: [], usage: { output_tokens: 1 } },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('lines that record no spend', () => {
    it('EMPTY: {no message} => fails, so a user turn is skipped', () => {
      expect(
        usageLineShapeContract.safeParse({ timestamp: '2026-09-13T04:49:29.242Z' }).success,
      ).toBe(false);
    });

    it('EMPTY: {no usage} => fails, so a tool-result line is skipped', () => {
      expect(
        usageLineShapeContract.safeParse({
          timestamp: '2026-09-13T04:49:29.242Z',
          message: { role: 'assistant' },
        }).success,
      ).toBe(false);
    });

    it('EMPTY: {no timestamp} => fails, because an unattributable sample cannot be windowed', () => {
      expect(
        usageLineShapeContract.safeParse({ message: { usage: { output_tokens: 1 } } }).success,
      ).toBe(false);
    });
  });
});
