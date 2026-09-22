import { ElementDeltaStub } from '../element-delta/element-delta.stub';
import { KeyRowStub } from '../key-row/key-row.stub';

import { compareAnswerContract } from './compare-answer-contract';
import { CompareAnswerStub } from './compare-answer.stub';

describe('compareAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {the spec line 2855-2861 example, plus elements} => parses the whole answer shape', () => {
      const appearedRow = KeyRowStub({ testId: 'GUILD_ADD_MODAL' });
      const answer = CompareAnswerStub({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
        console: { errors: '+2', new: ['Cannot read properties of null'] },
        server: { errors: '+0', new: [] },
        network: { errors: '+1', new: ['POST /api/guilds 500'] },
        pixels: 'last capture differs 12%',
        elements: {
          runA: null,
          runB: ElementDeltaStub({ appeared: [appearedRow] }),
        },
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
        elements: {
          runA: null,
          runB: { appeared: [appearedRow], disappeared: [], changed: [] },
        },
      });
    });

    it('VALID: {pixels: null} => two runs where one took no shot still parses', () => {
      const answer = CompareAnswerStub({ pixels: null });

      const result = compareAnswerContract.parse(answer);

      expect(result.pixels).toBe(null);
    });
  });

  describe('the elements field', () => {
    it('VALID: {elements.runA and elements.runB both null} => parses, meaning neither run recorded a delta', () => {
      const answer = CompareAnswerStub({ elements: { runA: null, runB: null } });

      const result = compareAnswerContract.parse(answer);

      expect(result.elements).toStrictEqual({ runA: null, runB: null });
    });

    it('INVALID: {+bogusField} => throws naming the stray key, .strict() still refuses an unknown top-level field', () => {
      expect(() =>
        compareAnswerContract.parse({
          instanceId: 'inst_7f3a9c21',
          runA: 'run_4',
          runB: 'run_5',
          console: { errors: '+2', new: [] },
          server: { errors: '+0', new: [] },
          network: { errors: '+1', new: [] },
          pixels: null,
          elements: { runA: null, runB: null },
          bogusField: 'x',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'bogusField'/u);
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
          elements: { runA: null, runB: null },
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing elements} => throws Required', () => {
      expect(() =>
        compareAnswerContract.parse({
          instanceId: 'inst_7f3a9c21',
          runA: 'run_4',
          runB: 'run_5',
          console: { errors: '+2', new: [] },
          server: { errors: '+0', new: [] },
          network: { errors: '+1', new: [] },
          pixels: null,
        }),
      ).toThrow(/Required/u);
    });
  });
});
