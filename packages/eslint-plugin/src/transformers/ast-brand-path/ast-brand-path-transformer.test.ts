import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { astBrandPathTransformer } from './ast-brand-path-transformer';

describe('astBrandPathTransformer', () => {
  describe('owner and keys', () => {
    it("VALID: {node under id of questContract} => returns ['questContract', 'id']", () => {
      const node = CallExpressionStub({ code: 'const questContract = { id: f() };' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'id']);
    });

    it('VALID: {node under owner.name of questContract} => returns every key on the way down', () => {
      const node = CallExpressionStub({ code: 'const questContract = { owner: { name: f() } };' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'owner', 'name']);
    });

    it("VALID: {node under a string-literal key} => reads the literal's text", () => {
      const node = CallExpressionStub({ code: 'const questContract = { "kebab-key": f() };' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'kebab-key']);
    });

    it("VALID: {node is the declarator's own init} => returns only the owner", () => {
      const node = CallExpressionStub({ code: 'const questContract = f();' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract']);
    });
  });

  describe('record, map and tuple positions', () => {
    it("VALID: {node is the first argument of z.record} => appends 'Key'", () => {
      const node = LiteralStub({
        code: 'const questContract = { counts: z.record("k", () => {}) };',
      });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'counts', 'Key']);
    });

    it("VALID: {node is the first argument of z.map} => appends 'Key'", () => {
      const node = LiteralStub({ code: 'const questContract = { byId: z.map("k", () => {}) };' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'byId', 'Key']);
    });

    it('VALID: {node is the value argument of z.record} => adds nothing for the value', () => {
      const node = ArrowFunctionExpressionStub({
        code: 'const questContract = { counts: z.record("k", () => {}) };',
      });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'counts']);
    });

    it("VALID: {node is the second position of z.tuple} => appends its index '1'", () => {
      const node = ArrowFunctionExpressionStub({
        code: 'const questContract = { span: z.tuple([1, () => {}]) };',
      });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'span', '1']);
    });

    it('VALID: {node in an array literal that is not a z.tuple argument} => adds no index', () => {
      const node = ArrowFunctionExpressionStub({
        code: 'const questContract = { either: z.union([() => {}]) };',
      });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'either']);
    });
  });

  describe('no owner', () => {
    it('EMPTY: {node with no declarator above it} => returns an empty path', () => {
      const node = CallExpressionStub({ code: '({ id: f() });' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {node with no parent} => returns an empty path', () => {
      const node = CallExpressionStub({ code: 'f();' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });
});
