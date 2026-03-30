import { tautologyLiteralKeyTransformer } from './tautology-literal-key-transformer';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('tautologyLiteralKeyTransformer', () => {
  describe('literal nodes', () => {
    it('VALID: {node: Literal(true)} => returns "true"', () => {
      const node = TsestreeStub({ type: 'Literal', value: true });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('true');
    });

    it('VALID: {node: Literal(false)} => returns "false"', () => {
      const node = TsestreeStub({ type: 'Literal', value: false });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('false');
    });

    it('VALID: {node: Literal(null)} => returns "null"', () => {
      const node = TsestreeStub({ type: 'Literal', value: null });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('null');
    });

    it('VALID: {node: Literal(1)} => returns "1"', () => {
      const node = TsestreeStub({ type: 'Literal', value: 1 });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('1');
    });

    it('VALID: {node: Literal("foo")} => returns quoted string', () => {
      const node = TsestreeStub({ type: 'Literal', value: 'foo' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('"foo"');
    });
  });

  describe('identifier nodes', () => {
    it('VALID: {node: Identifier(undefined)} => returns "undefined"', () => {
      const node = TsestreeStub({ type: 'Identifier', name: 'undefined' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('undefined');
    });

    it('VALID: {node: Identifier(NaN)} => returns "NaN"', () => {
      const node = TsestreeStub({ type: 'Identifier', name: 'NaN' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe('NaN');
    });
  });

  describe('non-literal nodes', () => {
    it('VALID: {node: CallExpression} => returns null', () => {
      const node = TsestreeStub({ type: 'CallExpression' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe(null);
    });

    it('VALID: {node: Identifier(result)} => returns null', () => {
      const node = TsestreeStub({ type: 'Identifier', name: 'result' });

      const result = tautologyLiteralKeyTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
