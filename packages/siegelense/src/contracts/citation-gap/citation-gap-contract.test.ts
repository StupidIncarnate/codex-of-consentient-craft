import { citationGapContract } from './citation-gap-contract';
import { CitationGapStub } from './citation-gap.stub';

describe('citationGapContract', () => {
  describe('valid gaps', () => {
    it('VALID: {the open-issue gap} => parses with the kind and the reason it was never checked', () => {
      const gap = CitationGapStub();

      const result = citationGapContract.parse(gap);

      expect(result).toStrictEqual({
        kind: 'open-issue',
        why: 'no issue record exists on disk to check',
      });
    });
  });

  describe('invalid gaps', () => {
    it('INVALID: {kind: "issue"} => an unlisted citation kind throws', () => {
      expect(() => {
        CitationGapStub({ kind: 'issue' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {kind omitted} => a gap with no kind throws, so a caller is never told something went unchecked without being told what', () => {
      expect(() => {
        citationGapContract.parse({ why: 'no issue record exists on disk to check' });
      }).toThrow(/Required/u);
    });
  });
});
