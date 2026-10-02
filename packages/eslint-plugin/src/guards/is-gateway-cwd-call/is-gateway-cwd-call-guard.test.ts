import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub as IdentifierNodeStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isGatewayCwdCallGuard } from './is-gateway-cwd-call-guard';

describe('isGatewayCwdCallGuard', () => {
  describe('named import binding', () => {
    it('VALID: {node: cwd(), cwdLocalNames: [cwd]} => true', () => {
      const node = CallExpressionStub({ code: 'cwd();' });

      const result = isGatewayCwdCallGuard({ node, cwdLocalNames: new Set(['cwd']) });

      expect(result).toBe(true);
    });

    it('VALID: {node: processCwd(), cwdLocalNames: [processCwd]} => true', () => {
      const node = CallExpressionStub({ code: 'processCwd();' });

      const result = isGatewayCwdCallGuard({ node, cwdLocalNames: new Set(['processCwd']) });

      expect(result).toBe(true);
    });

    it('VALID: {node: cwd(), cwdLocalNames: [other]} => false', () => {
      const node = CallExpressionStub({ code: 'cwd();' });

      const result = isGatewayCwdCallGuard({ node, cwdLocalNames: new Set(['other']) });

      expect(result).toBe(false);
    });

    it('EMPTY: {node: cwd(), no names} => false', () => {
      const node = CallExpressionStub({ code: 'cwd();' });

      const result = isGatewayCwdCallGuard({ node });

      expect(result).toBe(false);
    });
  });

  describe('namespace import binding', () => {
    it('VALID: {node: p.cwd(), namespaceLocalNames: [p]} => true', () => {
      const node = CallExpressionStub({ code: 'p.cwd();' });

      const result = isGatewayCwdCallGuard({ node, namespaceLocalNames: new Set(['p']) });

      expect(result).toBe(true);
    });

    it('VALID: {node: p.chdir(), namespaceLocalNames: [p]} => false', () => {
      const node = CallExpressionStub({ code: 'p.chdir();' });

      const result = isGatewayCwdCallGuard({ node, namespaceLocalNames: new Set(['p']) });

      expect(result).toBe(false);
    });

    it('VALID: {node: q.cwd(), namespaceLocalNames: [p]} => false', () => {
      const node = CallExpressionStub({ code: 'q.cwd();' });

      const result = isGatewayCwdCallGuard({ node, namespaceLocalNames: new Set(['p']) });

      expect(result).toBe(false);
    });

    it('VALID: {node: a.b.cwd(), namespaceLocalNames: [a]} => false', () => {
      const node = CallExpressionStub({ code: 'a.b.cwd();' });

      const result = isGatewayCwdCallGuard({ node, namespaceLocalNames: new Set(['a']) });

      expect(result).toBe(false);
    });

    it('VALID: {node: p[cwd](), namespaceLocalNames: [p]} => false', () => {
      const node = CallExpressionStub({ code: 'p[cwd]();' });

      const result = isGatewayCwdCallGuard({ node, namespaceLocalNames: new Set(['p']) });

      expect(result).toBe(false);
    });

    it('EMPTY: {node: p.cwd(), no names} => false', () => {
      const node = CallExpressionStub({ code: 'p.cwd();' });

      const result = isGatewayCwdCallGuard({ node });

      expect(result).toBe(false);
    });
  });

  describe('non-matching nodes', () => {
    it('EMPTY: {node: undefined} => false', () => {
      const result = isGatewayCwdCallGuard({
        cwdLocalNames: new Set(['cwd']),
        namespaceLocalNames: new Set(['p']),
      });

      expect(result).toBe(false);
    });

    it('VALID: {node: Identifier} => false', () => {
      const node = IdentifierNodeStub({ code: 'cwd;' });

      const result = isGatewayCwdCallGuard({ node, cwdLocalNames: new Set(['cwd']) });

      expect(result).toBe(false);
    });

    it('VALID: {node: (() => 1)()} => false', () => {
      const node = CallExpressionStub({ code: '(() => 1)();' });

      const result = isGatewayCwdCallGuard({
        node,
        cwdLocalNames: new Set(['cwd']),
        namespaceLocalNames: new Set(['p']),
      });

      expect(result).toBe(false);
    });
  });
});
