import { isAstObjectKeysCallGuard } from './is-ast-object-keys-call-guard';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('isAstObjectKeysCallGuard', () => {
  describe('Object.keys calls', () => {
    it('VALID: {node: Object.keys(obj)} => returns true', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({
          type: 'MemberExpression',
          object: TsestreeStub({ type: 'Identifier', name: 'Object' }),
          property: TsestreeStub({ type: 'Identifier', name: 'keys' }),
        }),
      });

      expect(isAstObjectKeysCallGuard({ node })).toBe(true);
    });
  });

  describe('non-Object.keys calls', () => {
    it('INVALID: {node: Object.values(obj)} => returns false', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({
          type: 'MemberExpression',
          object: TsestreeStub({ type: 'Identifier', name: 'Object' }),
          property: TsestreeStub({ type: 'Identifier', name: 'values' }),
        }),
      });

      expect(isAstObjectKeysCallGuard({ node })).toBe(false);
    });

    it('INVALID: {node: Identifier} => returns false', () => {
      const node = TsestreeStub({ type: 'Identifier', name: 'keys' });

      expect(isAstObjectKeysCallGuard({ node })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstObjectKeysCallGuard({})).toBe(false);
    });
  });
});
