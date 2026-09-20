import { compareAnswerContract } from './compare-answer-contract';
import { CompareAnswerStub } from './compare-answer.stub';

describe('compareAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {the spec line 2855-2861 example, minus elements} => parses with no elements field', () => {
      const answer = CompareAnswerStub({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
        console: { errors: '+2', new: ['Cannot read properties of null'] },
        server: { errors: '+0', new: [] },
        network: { errors: '+1', new: ['POST /api/guilds 500'] },
        pixels: 'last capture differs 12%',
      });

      const result = compareAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
        console: { errors: '+2', new: ['Cannot read properties of null'] },
        server: { errors: '+0', new: [] },
        network: { errors: '+1', new: ['POST /api/guilds 500'] },
        pixels: 'last capture differs 12%',
      });
    });

    it('VALID: {pixels: null} => two runs where one took no shot still parses', () => {
      const answer = CompareAnswerStub({ pixels: null });

      const result = compareAnswerContract.parse(answer);

      expect(result.pixels).toBe(null);
    });
  });

  describe('the elements refusal', () => {
    it("INVALID: {+elements} => throws naming the stray key, because a scoped element delta needs chunk 4's selector key", () => {
      expect(() =>
        compareAnswerContract.parse({
          instanceId: 'inst_7f3a9c21',
          runA: 'run_4',
          runB: 'run_5',
          console: { errors: '+2', new: [] },
          server: { errors: '+0', new: [] },
          network: { errors: '+1', new: [] },
          pixels: null,
          elements: '+0 -3 under GUILD_LIST',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'elements'/u);
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {missing runB} => throws Required', () => {
      expect(() =>
        compareAnswerContract.parse({
          instanceId: 'inst_7f3a9c21',
          runA: 'run_4',
          console: { errors: '+2', new: [] },
          server: { errors: '+0', new: [] },
          network: { errors: '+1', new: [] },
          pixels: null,
        }),
      ).toThrow(/Required/u);
    });
  });
});
