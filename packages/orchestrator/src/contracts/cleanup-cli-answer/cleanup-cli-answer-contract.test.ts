import { cleanupCliAnswerContract } from './cleanup-cli-answer-contract';
import { CleanupCliAnswerStub } from './cleanup-cli-answer.stub';

describe('cleanupCliAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {every field at zero} => parses successfully', () => {
      const answer = CleanupCliAnswerStub();

      expect(cleanupCliAnswerContract.parse(answer)).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        assetsAged: { instances: 0 },
      });
    });

    it('VALID: {one reaped entry, lock released} => parses successfully', () => {
      const answer = CleanupCliAnswerStub({
        reaped: [{ id: 'inst_9b2c' }],
        lockReleased: true,
        assetsAged: { instances: 3 },
      });

      expect(cleanupCliAnswerContract.parse(answer)).toStrictEqual({
        reaped: [{ id: 'inst_9b2c' }],
        portsReleased: [],
        lockReleased: true,
        assetsAged: { instances: 3 },
      });
    });

    it('VALID: {an extra key siegelense adds later} => parses successfully, not .strict()', () => {
      const result = cleanupCliAnswerContract.parse({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        assetsAged: { instances: 0, freedMB: 1840 },
        leftAlone: [],
      });

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        assetsAged: { instances: 0 },
      });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {assetsAged.instances: -1} => throws', () => {
      expect(() =>
        cleanupCliAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          lockReleased: false,
          assetsAged: { instances: -1 },
        }),
      ).toThrow(/to be >=0/u);
    });

    it('INVALID: {missing lockReleased} => throws', () => {
      expect(() =>
        cleanupCliAnswerContract.parse({
          reaped: [],
          portsReleased: [],
          assetsAged: { instances: 0 },
        }),
      ).toThrow(/received undefined/u);
    });
  });
});
