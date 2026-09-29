import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub as IdentifierNodeStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isProcessCwdCallGuard } from './is-process-cwd-call-guard';

describe('isProcessCwdCallGuard', () => {
  describe('process.cwd() calls', () => {
    it('VALID: {node: process.cwd() CallExpression} => true', () => {
      const node = CallExpressionStub({ code: 'process.cwd();' });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(true);
    });
  });

  describe('non-matching nodes', () => {
    it('VALID: {node: undefined} => false', () => {
      const result = isProcessCwdCallGuard({ node: undefined });

      expect(result).toBe(false);
    });

    it('VALID: {node: Identifier} => false', () => {
      const node = IdentifierNodeStub({ code: 'process;' });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });

    it('VALID: {node: process.env CallExpression} => false', () => {
      const node = CallExpressionStub({ code: 'process.env();' });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });

    it('VALID: {node: foo.cwd() CallExpression} => false', () => {
      const node = CallExpressionStub({ code: 'foo.cwd();' });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });

    it('VALID: {node: bare cwd() CallExpression with Identifier callee} => false', () => {
      const node = CallExpressionStub({ code: 'cwd();' });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });
  });
});
