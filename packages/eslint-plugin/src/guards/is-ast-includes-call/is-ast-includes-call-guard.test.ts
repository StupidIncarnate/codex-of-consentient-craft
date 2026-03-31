import { isAstIncludesCallGuard } from './is-ast-includes-call-guard';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('isAstIncludesCallGuard', () => {
  describe('.includes() calls', () => {
    it('VALID: {node: str.includes(x)} => returns true', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({
          type: 'MemberExpression',
          object: TsestreeStub({ type: 'Identifier', name: 'str' }),
          property: TsestreeStub({ type: 'Identifier', name: 'includes' }),
        }),
      });

      expect(isAstIncludesCallGuard({ node })).toBe(true);
    });
  });

  describe('non-.includes() calls', () => {
    it('INVALID: {node: str.startsWith(x)} => returns false', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({
          type: 'MemberExpression',
          object: TsestreeStub({ type: 'Identifier', name: 'str' }),
          property: TsestreeStub({ type: 'Identifier', name: 'startsWith' }),
        }),
      });

      expect(isAstIncludesCallGuard({ node })).toBe(false);
    });

    it('INVALID: {node: Identifier} => returns false', () => {
      const node = TsestreeStub({ type: 'Identifier', name: 'includes' });

      expect(isAstIncludesCallGuard({ node })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstIncludesCallGuard({})).toBe(false);
    });
  });
});
