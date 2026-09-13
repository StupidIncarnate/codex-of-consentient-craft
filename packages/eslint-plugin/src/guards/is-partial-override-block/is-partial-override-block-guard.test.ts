import { isPartialOverrideBlockGuard } from './is-partial-override-block-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('isPartialOverrideBlockGuard', () => {
  describe('override bags', () => {
    it('VALID: {two optional members, one host, two properties} => returns true', () => {
      const block = TsestreeStub({
        type: TsestreeNodeType.TSTypeLiteral,
        members: [
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
        ],
      });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        true,
      );
    });

    it('VALID: {interface body carrying members on body} => returns true', () => {
      const block = TsestreeStub({
        type: TsestreeNodeType.TSInterfaceBody,
        body: [
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
        ],
      });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        true,
      );
    });
  });

  describe('flattened contracts', () => {
    it('INVALID: {one member required} => returns false', () => {
      const block = TsestreeStub({
        type: TsestreeNodeType.TSTypeLiteral,
        members: [
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: false }),
        ],
      });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });

    it('INVALID: {block carries a member the host does not account for} => returns false', () => {
      const block = TsestreeStub({
        type: TsestreeNodeType.TSTypeLiteral,
        members: [
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
        ],
      });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });

    it('INVALID: {two hosts in one block} => returns false', () => {
      const block = TsestreeStub({
        type: TsestreeNodeType.TSTypeLiteral,
        members: [
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
        ],
      });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 2, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });

    it('INVALID: {a member that is not a property signature} => returns false', () => {
      const block = TsestreeStub({
        type: TsestreeNodeType.TSTypeLiteral,
        members: [
          TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optional: true }),
          TsestreeStub({ type: TsestreeNodeType.TSIndexSignature, optional: true }),
        ],
      });

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
      const block = TsestreeStub({ type: TsestreeNodeType.TSTypeLiteral, members: [] });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1 })).toBe(false);
    });

    it('EMPTY: {block with neither members nor body} => returns false', () => {
      const block = TsestreeStub({ type: TsestreeNodeType.TSTypeLiteral });

      expect(isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 })).toBe(
        false,
      );
    });
  });
});
