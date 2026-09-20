import { cleanupAnswerContract } from './cleanup-answer-contract';
import { CleanupAnswerStub } from './cleanup-answer.stub';

describe('cleanupAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {the spec line 1404-1409 example} => parses with assetsAged and both leftAlone reasons', () => {
      const answer = CleanupAnswerStub({
        reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33_812, 33_840], homeRemoved: true }],
        portsReleased: [41_345, 34_173],
        lockReleased: true,
        assetsAged: { instances: 3, freedMB: 1840 },
        leftAlone: [
          { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
          {
            id: 'inst_1d09',
            why: 'run_7 cited by a VERIFIED prelude in .quest-plans/1dac5395…/path-3.md',
          },
        ],
      });

      const result = cleanupAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33_812, 33_840], homeRemoved: true }],
        portsReleased: [41_345, 34_173],
        lockReleased: true,
        assetsAged: { instances: 3, freedMB: 1840 },
        leftAlone: [
          { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
          {
            id: 'inst_1d09',
            why: 'run_7 cited by a VERIFIED prelude in .quest-plans/1dac5395…/path-3.md',
          },
        ],
      });
    });

    it('EMPTY: {reaped: [], leftAlone: [], nothing aged} => a clean machine is a real answer, and the aged pair reads zero rather than absent', () => {
      const answer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });

      const result = cleanupAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: true,
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });
    });

    it('VALID: {reaped: [], leftAlone: [two entries]} => a cleanup that removed nothing still says why for each', () => {
      const answer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [
          { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
          { id: 'inst_1d09', why: 'reserved — booting, no beat yet' },
        ],
      });

      const result = cleanupAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: true,
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [
          { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
          { id: 'inst_1d09', why: 'reserved — booting, no beat yet' },
        ],
      });
    });
  });

  describe('assetsAged', () => {
    it('INVALID: {assetsAged omitted} => throws Required, so an answer can never be silent about whether it touched evidence', () => {
      expect(() =>
        cleanupAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          lockReleased: true,
          leftAlone: [],
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {assetsAged: {instances: 3}} => a count with no size throws, so a caller can never read one without the other', () => {
      expect(() =>
        cleanupAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          lockReleased: true,
          assetsAged: { instances: 3 },
          leftAlone: [],
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {assetsAged carrying videoFirst} => throws naming the stray key, because no built step writes a video', () => {
      expect(() =>
        cleanupAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          lockReleased: true,
          assetsAged: { instances: 3, freedMB: 1840, videoFirst: true },
          leftAlone: [],
        }),
      ).toThrow(/Unrecognized key\(s\) in object: 'videoFirst'/u);
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {missing lockReleased} => throws Required', () => {
      expect(() =>
        cleanupAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          assetsAged: { instances: 0, freedMB: 0 },
          leftAlone: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
