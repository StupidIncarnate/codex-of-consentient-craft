import { resultsArgsContract } from './results-args-contract';
import { ResultsArgsStub } from './results-args.stub';

describe('resultsArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId only} => every other member null', () => {
      const args = ResultsArgsStub({ instanceId: 'inst_7f3a9c21' });

      const result = resultsArgsContract.parse(args);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: null,
        where: null,
        fields: null,
        since: null,
        json: false,
      });
    });

    it('VALID: {every member set} => parses the complete query', () => {
      const args = ResultsArgsStub({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_2',
        step: 7,
        kind: 'network',
        where: { path: '/api/quests', method: 'POST', nth: null, level: null, steps: null },
        fields: ['status', 'responseBody'],
        since: null,
        json: false,
      });

      const result = resultsArgsContract.parse(args);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_2',
        step: 7,
        kind: 'network',
        where: { path: '/api/quests', method: 'POST', nth: null, level: null, steps: null },
        fields: ['status', 'responseBody'],
        since: null,
        json: false,
      });
    });
  });

  describe('rejecting a stray key', () => {
    it('INVALID: {instance instead of instanceId} => throws naming the stray key', () => {
      expect(() =>
        resultsArgsContract.parse({
          instance: 'inst_7f3a9c21',
          runId: null,
          step: null,
          kind: null,
          where: null,
          fields: null,
          since: null,
          json: false,
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'instance'/u);
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing instanceId} => raises exactly one issue, scoped to instanceId', () => {
      const result = resultsArgsContract.safeParse({
        runId: null,
        step: null,
        kind: null,
        where: null,
        fields: null,
        since: null,
        json: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['instanceId'],
          message: 'Required',
        },
      ]);
    });
  });
});
