import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { astCollectNodesTransformer } from '../../transformers/ast-collect-nodes/ast-collect-nodes-transformer';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';
import { isAstUnbrandedLeafGuard } from './is-ast-unbranded-leaf-guard';

// Calls come back in source order, outermost first, so `index` picks the call under test.
const callAt = ({ code, index }: { code: string; index: number }) =>
  astCollectNodesTransformer({
    node: ProgramStub({ code }),
    type: AST_NODE_TYPES.CallExpression,
  }).at(index);

describe('isAstUnbrandedLeafGuard', () => {
  describe('a leaf with no brand', () => {
    it.each([
      ['a property', 'const a = z.object({ title: z.string() });', 1],
      ['a property with checks', 'const a = z.object({ title: z.string().min(1) });', 2],
      ['an optional property', 'const a = z.object({ n: z.number().optional() });', 2],
      ['a strict object property', 'const a = z.strictObject({ n: z.number() });', 1],
      ['an extend property', 'const a = bContract.extend({ n: z.number() });', 1],
      ['an array element', 'const a = z.object({ tags: z.array(z.string()) });', 2],
      ['a set element', 'const a = z.object({ tags: z.set(z.string()) });', 2],
      ['a record key', 'const a = z.object({ c: z.record(z.string(), z.enum([])) });', 2],
      ['a record value', 'const a = z.object({ c: z.record(z.enum([]), z.number()) });', 3],
      ['a map value', 'const a = z.object({ c: z.map(z.enum([]), z.number()) });', 3],
      ['a tuple position', 'const a = z.object({ s: z.tuple([z.number(), z.number()]) });', 3],
      ['a v4 format', 'const a = z.object({ id: z.uuid() });', 1],
    ])('VALID: {%s} => returns true', (_name, code, index) => {
      expect(isAstUnbrandedLeafGuard({ node: callAt({ code, index }) })).toBe(true);
    });

    it.each(zodObjectBrandStatics.leafRoots)('VALID: {z.%s()} => returns true', (root) => {
      const code = `const a = z.object({ v: z.${root}() });`;

      expect(isAstUnbrandedLeafGuard({ node: callAt({ code, index: 1 }) })).toBe(true);
    });
  });

  describe('a leaf with a brand', () => {
    it.each([
      ['directly', 'const a = z.object({ t: z.string().brand<"T">() });', 2],
      ['after checks', 'const a = z.object({ t: z.string().min(1).brand<"T">() });', 3],
      ['before a wrapper', 'const a = z.object({ t: z.string().brand<"T">().optional() });', 3],
      ['after a wrapper', 'const a = z.object({ t: z.string().optional().brand<"T">() });', 3],
      ['as an array element', 'const a = z.object({ t: z.array(z.string().brand<"T">()) });', 3],
    ])('VALID: {brand %s} => returns false', (_name, code, index) => {
      expect(isAstUnbrandedLeafGuard({ node: callAt({ code, index }) })).toBe(false);
    });
  });

  describe('a leaf that is not a field of an object contract', () => {
    it.each([
      ['a bare const', 'const a = z.string();', 0],
      ['a plain object literal', 'const a = { title: z.string() };', 0],
      ['a union member', 'const a = z.object({ u: z.union([z.string(), z.number()]) });', 2],
      ['a parse argument', 'const a = z.string().parse(line);', 1],
      ['a function argument', 'const a = run(z.string());', 1],
    ])('VALID: {%s} => returns false', (_name, code, index) => {
      expect(isAstUnbrandedLeafGuard({ node: callAt({ code, index }) })).toBe(false);
    });
  });

  describe('a call that is not a leaf', () => {
    it.each([
      ['an enum', 'const a = z.object({ s: z.enum(["a"]) });', 1],
      ['a boolean', 'const a = z.object({ s: z.boolean() });', 1],
      ['a nested object', 'const a = z.object({ s: z.object({}) });', 1],
      ['a reuse', 'const a = z.object({ s: bContract.shape.id.optional() });', 1],
      ['another namespace', 'const a = z.object({ s: y.string() });', 1],
    ])('VALID: {%s} => returns false', (_name, code, index) => {
      expect(isAstUnbrandedLeafGuard({ node: callAt({ code, index }) })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstUnbrandedLeafGuard({})).toBe(false);
    });
  });
});
