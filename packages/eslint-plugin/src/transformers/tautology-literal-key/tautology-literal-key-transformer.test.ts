import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { tautologyLiteralKeyTransformer } from './tautology-literal-key-transformer';

describe('tautologyLiteralKeyTransformer', () => {
  describe('literal nodes', () => {
    it('VALID: {node: Literal(true)} => returns "true"', () => {
      const node = LiteralStub({ code: 'const l = true;' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('true');
    });

    it('VALID: {node: Literal(false)} => returns "false"', () => {
      const node = LiteralStub({ code: 'const l = false;' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('false');
    });

    it('VALID: {node: Literal(null)} => returns "null"', () => {
      const node = LiteralStub({ code: 'const l = null;' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('null');
    });

    it('VALID: {node: Literal(1)} => returns "1"', () => {
      const node = LiteralStub({ code: 'const l = 1;' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('1');
    });

    it('VALID: {node: Literal("foo")} => returns quoted string', () => {
      const node = LiteralStub({ code: 'const l = "foo";' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('"foo"');
    });
  });

  describe('identifier nodes', () => {
    it('VALID: {node: Identifier(undefined)} => returns "undefined"', () => {
      const node = IdentifierStub({ code: 'undefined;' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('undefined');
    });

    it('VALID: {node: Identifier(NaN)} => returns "NaN"', () => {
      const node = IdentifierStub({ code: 'NaN;' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('NaN');
    });
  });

  describe('non-literal nodes', () => {
    it('VALID: {node: CallExpression} => returns null', () => {
      const node = CallExpressionStub({ code: 'f();' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe(null);
    });

    it('VALID: {node: Identifier(result)} => returns null', () => {
      const node = IdentifierStub({ code: 'result;' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
