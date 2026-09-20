import { extraVerbNameContract } from './extra-verb-name-contract';
import { ExtraVerbNameStub } from './extra-verb-name.stub';
import { reservedVerbStatics } from '../../statics/reserved-verb/reserved-verb-statics';

describe('extraVerbNameContract', () => {
  describe('valid extra verb names', () => {
    it('VALID: {value: "withNestedChain"} => returns "withNestedChain"', () => {
      expect(ExtraVerbNameStub({ value: 'withNestedChain' })).toBe('withNestedChain');
    });
  });

  describe('invalid extra verb names', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => extraVerbNameContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });

    it.each(reservedVerbStatics.verbs)(
      'INVALID: {value: %s} => throws naming the reserved verb',
      (verb) => {
        expect(() => extraVerbNameContract.parse(verb)).toThrow(
          new RegExp(`'${verb}' is a reserved verb and cannot be declared as an extra`, 'u'),
        );
      },
    );
  });
});
