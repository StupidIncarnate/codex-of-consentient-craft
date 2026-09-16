import { cleanupAnswerContract } from './cleanup-answer-contract';
import { CleanupAnswerStub } from './cleanup-answer.stub';

describe('cleanupAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {the spec line 1357-1362 example, minus assetsAged} => parses with no assetsAged field', () => {
      const answer = CleanupAnswerStub({
        reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33_812, 33_840], homeRemoved: true }],
        portsReleased: [41_345, 34_173],
        lockReleased: true,
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
        leftAlone: [
          { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
          {
            id: 'inst_1d09',
            why: 'run_7 cited by a VERIFIED prelude in .quest-plans/1dac5395…/path-3.md',
          },
        ],
      });
    });

    it('EMPTY: {reaped: [], leftAlone: []} => a clean machine is a real answer', () => {
      const answer = CleanupAnswerStub({ reaped: [], portsReleased: [], leftAlone: [] });

      const result = cleanupAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: true,
        leftAlone: [],
      });
    });

    it('VALID: {reaped: [], leftAlone: [two entries]} => a cleanup that removed nothing still says why for each', () => {
      const answer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
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
        leftAlone: [
          { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
          { id: 'inst_1d09', why: 'reserved — booting, no beat yet' },
        ],
      });
    });
  });

  describe('the assetsAged refusal', () => {
    it('INVALID: {+assetsAged} => throws naming the stray key, because cleanup ages nothing yet', () => {
      expect(() =>
        cleanupAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          lockReleased: true,
          leftAlone: [],
          assetsAged: { instances: 3, freedMB: 1840 },
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'assetsAged'/u);
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {missing lockReleased} => throws Required', () => {
      expect(() =>
        cleanupAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          leftAlone: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
