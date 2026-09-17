import { CitationReferenceStub } from '../citation-reference/citation-reference.stub';
import { citationResolutionContract } from './citation-resolution-contract';
import { CitationResolutionStub } from './citation-resolution.stub';

describe('citationResolutionContract', () => {
  describe('valid resolutions', () => {
    it('VALID: {nothing cited, one kind unchecked} => parses, and the unchecked kind survives into the answer', () => {
      const resolution = CitationResolutionStub();

      const result = citationResolutionContract.parse(resolution);

      expect(result).toStrictEqual({
        references: [],
        gaps: [{ kind: 'open-issue', why: 'no issue record exists on disk to check' }],
        blocked: null,
      });
    });

    it('VALID: {one reference} => parses, carrying the citing file through', () => {
      const resolution = CitationResolutionStub({
        references: [CitationReferenceStub()],
        gaps: [],
      });

      const result = citationResolutionContract.parse(resolution);

      expect(result.references).toStrictEqual([
        {
          kind: 'walked-note',
          instanceId: 'inst_1d09',
          runId: 'run_7',
          citingFile: '/tmp/quests/q1/quest.json',
          why: 'run_7 cited by a WALKED note on open quest q1 in /tmp/quests/q1/quest.json',
        },
      ]);
    });

    it('VALID: {blocked: a reason} => parses, so "could not establish" is representable and never collapses to an empty list', () => {
      const resolution = CitationResolutionStub({
        blocked: 'quest q1 is recorded on the row but its guild is not' as never,
      });

      const result = citationResolutionContract.parse(resolution);

      expect(result.blocked).toBe('quest q1 is recorded on the row but its guild is not');
    });
  });

  describe('invalid resolutions', () => {
    it('INVALID: {blocked omitted} => throws, so a resolution can never be silent about whether it settled', () => {
      expect(() => {
        citationResolutionContract.parse({ references: [], gaps: [] });
      }).toThrow(/Required/u);
    });

    it('INVALID: {an extra key} => .strict() throws rather than accepting a field nothing reads', () => {
      expect(() => {
        citationResolutionContract.parse({
          references: [],
          gaps: [],
          blocked: null,
          checked: true,
        });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
