import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';

import { docsScopeContract } from './docs-scope-contract';
import { DocsScopeStub } from './docs-scope.stub';

describe('docsScopeContract', () => {
  describe('valid members', () => {
    it.each(siegelenseCallStatics.docs.scopes)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const scope = DocsScopeStub({ value });

        const result = docsScopeContract.parse(scope);

        expect(result).toBe(value);
      },
    );

    it('VALID: {no argument} => the stub defaults to walking', () => {
      expect(DocsScopeStub()).toBe('walking');
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "reader"} => the code-reading role has no scope and is refused', () => {
      expect(() => {
        DocsScopeStub({ value: 'reader' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "start"} => a call name is not a scope name', () => {
      expect(() => {
        docsScopeContract.parse('start');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "planning"} => the planning scope is deleted, and refused like any unknown scope', () => {
      expect(() => {
        docsScopeContract.parse('planning');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "driving"} => the driving scope is deleted, and refused like any unknown scope', () => {
      expect(() => {
        docsScopeContract.parse('driving');
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "Walking"} => a mismatched-case variant of a valid member is refused', () => {
      expect(() => {
        docsScopeContract.parse('Walking');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
