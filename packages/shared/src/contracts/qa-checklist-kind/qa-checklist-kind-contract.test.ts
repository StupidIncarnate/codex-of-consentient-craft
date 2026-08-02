import { qaChecklistKindContract } from './qa-checklist-kind-contract';
import { QaChecklistKindStub } from './qa-checklist-kind.stub';

describe('qaChecklistKindContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the four verification-unit kinds', () => {
      expect(qaChecklistKindContract.options).toStrictEqual([
        'terminal',
        'branch',
        'observable',
        'off-map',
      ]);
    });

    it.each(qaChecklistKindContract.options)('VALID: {kind: %s} => parses to itself', (kind) => {
      expect(QaChecklistKindStub({ value: kind })).toBe(kind);
    });
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to observable', () => {
      expect(QaChecklistKindStub()).toBe('observable');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {kind: "node"} => throws', () => {
      expect(() => QaChecklistKindStub({ value: 'node' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {kind: ""} => throws', () => {
      expect(() => QaChecklistKindStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
