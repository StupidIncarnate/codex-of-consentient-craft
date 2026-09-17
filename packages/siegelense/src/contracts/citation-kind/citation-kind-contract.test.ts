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

    it('VALID: {no argument} => defaults to walked-note', () => {
      expect(CitationKindStub()).toBe('walked-note');
    });
  });

  describe('the closed set', () => {
    it('VALID: {options} => exactly the three things the spec says hold evidence', () => {
      expect(citationKindContract.unwrap().options).toStrictEqual([
        'verified-prelude',
        'open-issue',
        'walked-note',
      ]);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "prelude"} => an unlisted string throws validation error', () => {
      expect(() => {
        CitationKindStub({ value: 'prelude' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: ""} => throws validation error', () => {
      expect(() => {
        citationKindContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
