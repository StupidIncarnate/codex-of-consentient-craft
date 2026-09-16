import { isSavedRefGuard } from './is-saved-ref-guard';
import { SavedRefStub } from '../../contracts/saved-ref/saved-ref.stub';

describe('isSavedRefGuard', () => {
  describe('valid saved refs', () => {
    it('VALID: {value: a SavedRef} => returns true', () => {
      const value = SavedRefStub({ name: 'origin' });

      expect(isSavedRefGuard({ value })).toBe(true);
    });
  });

  describe('values missing the marker', () => {
    it('INVALID: {value: {name: "origin"}} => returns false', () => {
      expect(isSavedRefGuard({ value: { name: 'origin' } })).toBe(false);
    });

    it('INVALID: {value: {__savedRef: false}} => returns false', () => {
      expect(isSavedRefGuard({ value: { __savedRef: false } })).toBe(false);
    });
  });

  describe('non-object values', () => {
    it('INVALID: {value: "origin"} => returns false', () => {
      expect(isSavedRefGuard({ value: 'origin' })).toBe(false);
    });

    it('INVALID: {value: null} => returns false', () => {
      expect(isSavedRefGuard({ value: null })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isSavedRefGuard({})).toBe(false);
    });
  });
});
