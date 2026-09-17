import { ElapsedTextStub } from '../../contracts/elapsed-text/elapsed-text.stub';
import { elapsedRenderTransformer } from '../elapsed-render/elapsed-render-transformer';
import { pruneOlderThanParseTransformer } from './prune-older-than-parse-transformer';

describe('pruneOlderThanParseTransformer', () => {
  describe('valid windows', () => {
    it('VALID: {olderThan: "7d"} => returns 604800000', () => {
      expect(pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '7d' }) })).toBe(
        604_800_000,
      );
    });

    it('VALID: {olderThan: "2d"} => returns 172800000, the video window', () => {
      expect(pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '2d' }) })).toBe(
        172_800_000,
      );
    });

    it('VALID: {olderThan: "30m"} => returns 1800000', () => {
      expect(pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '30m' }) })).toBe(
        1_800_000,
      );
    });

    it('VALID: {olderThan: "90s"} => returns 90000', () => {
      expect(pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '90s' }) })).toBe(
        90_000,
      );
    });

    it('VALID: {olderThan: "9h"} => returns 32400000', () => {
      expect(pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '9h' }) })).toBe(
        32_400_000,
      );
    });

    it('EDGE: {olderThan: "0s"} => returns 0, the explicit "everything up to this instant" form', () => {
      expect(pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '0s' }) })).toBe(
        0,
      );
    });

    it('VALID: {olderThan: "7d"} => round-trips through elapsedRenderTransformer unchanged', () => {
      const parsed = pruneOlderThanParseTransformer({
        olderThan: ElapsedTextStub({ value: '7d' }),
      });

      expect(elapsedRenderTransformer({ elapsedMs: parsed })).toBe('7d');
    });
  });

  describe('invalid windows', () => {
    it('INVALID: {olderThan: "7"} => throws, so a bare number is never read as milliseconds', () => {
      expect(() =>
        pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '7' }) }),
      ).toThrow(
        /^Unreadable window: 7\. A window is a whole number followed by one of d, h, m, s — for example 7d\.$/u,
      );
    });

    it('INVALID: {olderThan: "7w"} => throws naming the accepted units', () => {
      expect(() =>
        pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '7w' }) }),
      ).toThrow(/^Unknown window unit: w in 7w\. Accepted units are d, h, m, s\.$/u);
    });

    it('INVALID: {olderThan: "-1d"} => throws rather than computing a window in the future', () => {
      expect(() =>
        pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '-1d' }) }),
      ).toThrow(/^Unreadable window: -1d\./u);
    });

    it('INVALID: {olderThan: "1.5d"} => throws rather than silently flooring', () => {
      expect(() =>
        pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '1.5d' }) }),
      ).toThrow(/^Unreadable window: 1\.5d\./u);
    });

    it('INVALID: {olderThan: "7D"} => an uppercase unit throws rather than being guessed at', () => {
      expect(() =>
        pruneOlderThanParseTransformer({ olderThan: ElapsedTextStub({ value: '7D' }) }),
      ).toThrow(/^Unreadable window: 7D\./u);
    });
  });
});
