import { citationKindContract } from './citation-kind-contract';
import { CitationKindStub } from './citation-kind.stub';

describe('citationKindContract', () => {
  describe('valid members', () => {
    it.each(citationKindContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const citationKind = CitationKindStub({ value });

        const result = citationKindContract.parse(citationKind);

        expect(result).toBe(value);
      },
    );

    it('VALID: {value: "unjudged-screencast"} => parses to itself, the kind whose reader arrives after the quest is over', () => {
      const result = citationKindContract.parse('unjudged-screencast');

      expect(result).toBe('unjudged-screencast');
    });

    it('VALID: {no argument} => defaults to walked-note', () => {
      expect(CitationKindStub()).toBe('walked-note');
    });
  });

  describe('the closed set', () => {
    it('VALID: {options} => exactly the things the spec says hold evidence', () => {
      expect(citationKindContract.unwrap().options).toStrictEqual([
        'verified-prelude',
        'open-issue',
        'walked-note',
        'unjudged-screencast',
      ]);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "prelude"} => an unlisted string throws validation error', () => {
      expect(() => {
        CitationKindStub({ value: 'prelude' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "screencast"} => the near miss of the newest kind throws validation error', () => {
      expect(() => {
        CitationKindStub({ value: 'screencast' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: ""} => throws validation error', () => {
      expect(() => {
        citationKindContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws, rather than accepting an absent kind as a member', () => {
      expect(() => {
        citationKindContract.parse(null);
      }).toThrow(
        /Expected 'verified-prelude' \| 'open-issue' \| 'walked-note' \| 'unjudged-screencast', received null/u,
      );
    });

    it('INVALID: {value: 4} => a number throws, rather than being coerced to a member', () => {
      expect(() => {
        citationKindContract.parse(4);
      }).toThrow(/received number/u);
    });
  });
});
