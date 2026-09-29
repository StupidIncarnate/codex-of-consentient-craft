import { TSTypeLiteralStub } from '#gateway/npm/typescript-eslint__utils/ts-type-literal/ts-type-literal.stub';
import { TSInterfaceBodyStub } from '#gateway/npm/typescript-eslint__utils/ts-interface-body/ts-interface-body.stub';
import { isPartialOverrideBlockGuard } from './is-partial-override-block-guard';

describe('isPartialOverrideBlockGuard', () => {
  describe('override bags', () => {
    it('VALID: {two optional members, one host, two properties} => returns true', () => {
      const block = TSTypeLiteralStub({ code: 'type T = { a?; a? };' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        true,
      );
    });

    it('VALID: {interface body carrying members on body} => returns true', () => {
      const block = TSInterfaceBodyStub({ code: 'interface I { a?; a? }' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        true,
      );
    });
  });

  describe('flattened contracts', () => {
    it('INVALID: {one member required} => returns false', () => {
      const block = TSTypeLiteralStub({ code: 'type T = { a?; a };' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });

    it('INVALID: {block carries a member the host does not account for} => returns false', () => {
      const block = TSTypeLiteralStub({ code: 'type T = { a?; a?; a? };' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });

    it('INVALID: {two hosts in one block} => returns false', () => {
      const block = TSTypeLiteralStub({ code: 'type T = { a?; a? };' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 2, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });

    it('INVALID: {a member that is not a property signature} => returns false', () => {
      const block = TSTypeLiteralStub({ code: 'type T = { a?: string; [key: string]: string };' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {block: undefined} => returns false', () => {
      expect(isPartialOverrideBlockGuard({ hostCount: 1, distinctPropertyCount: 2 })).toBe(false);
    });

    it('EMPTY: {distinctPropertyCount: undefined} => returns false', () => {
      const block = TSTypeLiteralStub({ code: 'type T = {  };' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1 })).toBe(false);
    });

    it('EMPTY: {block with neither members nor body} => returns false', () => {
      const block = TSTypeLiteralStub({ code: 'type T = {  };' });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });
  });
});
