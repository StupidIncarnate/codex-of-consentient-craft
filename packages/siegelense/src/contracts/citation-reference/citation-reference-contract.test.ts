import { citationReferenceContract } from './citation-reference-contract';
import { CitationReferenceStub } from './citation-reference.stub';

describe('citationReferenceContract', () => {
  describe('valid references', () => {
    it('VALID: {a walked-note citation} => parses with the citing file and the run id intact', () => {
      const reference = CitationReferenceStub();

      const result = citationReferenceContract.parse(reference);

      expect(result).toStrictEqual({
        kind: 'walked-note',
        instanceId: 'inst_1d09',
        runId: 'run_7',
        citingFile: '/tmp/quests/q1/quest.json',
        why: 'run_7 cited by a WALKED note on open quest q1 in /tmp/quests/q1/quest.json',
      });
    });

    it('VALID: {runId: null} => a citation naming the instance but no single run still parses', () => {
      const reference = CitationReferenceStub({ runId: null });

      const result = citationReferenceContract.parse(reference);

      expect(result.runId).toBe(null);
    });
  });

  describe('invalid references', () => {
    it('INVALID: {citingFile: "quest.json"} => a relative path throws, so a refusal can never name an unopenable file', () => {
      expect(() => {
        CitationReferenceStub({ citingFile: 'quest.json' as never });
      }).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {kind: "prelude"} => an unlisted citation kind throws', () => {
      expect(() => {
        CitationReferenceStub({ kind: 'prelude' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {runId: "run_zero"} => a malformed run id throws rather than reaching a refusal sentence', () => {
      expect(() => {
        CitationReferenceStub({ runId: 'run_zero' as never });
      }).toThrow(/Invalid/u);
    });
  });
});
