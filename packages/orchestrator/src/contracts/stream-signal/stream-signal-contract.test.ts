import { streamSignalContract } from './stream-signal-contract';
import { StreamSignalStub } from './stream-signal.stub';

type StreamSignal = ReturnType<typeof StreamSignalStub>;

describe('streamSignalContract', () => {
  describe('valid signals', () => {
    it('VALID: {signal: "complete", summary} => parses complete signal', () => {
      const result = streamSignalContract.parse({
        signal: 'complete',
        summary: 'Done',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
        summary: 'Done',
      });
    });

    it('VALID: {signal: "failed", summary} => parses failed signal', () => {
      const result = streamSignalContract.parse({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });

      expect(result).toStrictEqual({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });
    });

    it('VALID: stub default => returns complete signal with expected structure', () => {
      const signal: StreamSignal = StreamSignalStub();

      expect(signal).toStrictEqual({
        signal: 'complete',
        summary: 'Task completed successfully',
      });
    });

    it('VALID: {signal: "complete"} => parses without optional summary', () => {
      const result = streamSignalContract.parse({
        signal: 'complete',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
      });
    });

    it('VALID: {signal: "failed"} => parses without optional summary', () => {
      const result = streamSignalContract.parse({
        signal: 'failed',
      });

      expect(result).toStrictEqual({
        signal: 'failed',
      });
    });

    it('VALID: {signal: "failed-replan", summary} => parses failed-replan signal', () => {
      const result = streamSignalContract.parse({
        signal: 'failed-replan',
        summary: 'Semantic findings require new steps',
      });

      expect(result).toStrictEqual({
        signal: 'failed-replan',
        summary: 'Semantic findings require new steps',
      });
    });

    it('VALID: {signal: "failed-replan"} => parses without optional summary', () => {
      const result = streamSignalContract.parse({
        signal: 'failed-replan',
      });

      expect(result).toStrictEqual({
        signal: 'failed-replan',
      });
    });
  });

  describe('invalid signals', () => {
    it('INVALID: {signal: "unknown"} => throws for invalid signal type', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'unknown',
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {signal: "partially-complete"} => throws for removed signal type', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'partially-complete',
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {signal: "needs-role-followup"} => throws for removed signal type', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'needs-role-followup',
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {signal: missing} => throws for missing signal', () => {
      expect(() => streamSignalContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {summary: ""} => throws for empty summary', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'complete',
          summary: '',
        }),
      ).toThrow(/too_small/u);
    });
  });
});
