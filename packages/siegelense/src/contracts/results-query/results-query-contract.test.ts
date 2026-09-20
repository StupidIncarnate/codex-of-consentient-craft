import { resultsQueryContract } from './results-query-contract';
import { ResultsQueryStub } from './results-query.stub';

describe('resultsQueryContract', () => {
  describe('valid queries', () => {
    it('VALID: {instanceId only} => parses with every other member null', () => {
      const query = ResultsQueryStub({ instanceId: 'inst_7f3a9c21' });

      const result = resultsQueryContract.parse(query);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: null,
        where: null,
        fields: null,
        since: null,
      });
    });

    it('VALID: {kind, since: "boot"} => parses a whole-timeline query', () => {
      const query = ResultsQueryStub({
        instanceId: 'inst_7f3a9c21',
        kind: 'console',
        since: 'boot',
      });

      const result = resultsQueryContract.parse(query);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: 'console',
        where: null,
        fields: null,
        since: 'boot',
      });
    });
  });

  describe('rejecting an unknown field', () => {
    it('INVALID: {instanceId, +unknownField} => throws naming the stray key', () => {
      expect(() =>
        resultsQueryContract.parse({
          instanceId: 'inst_7f3a9c21',
          runId: null,
          step: null,
          kind: null,
          where: null,
          fields: null,
          since: null,
          unknownField: true,
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'unknownField'/u);
    });
  });
});
