import { TSTypeOperatorStub } from '#gateway/npm/typescript-eslint__utils/ts-type-operator/ts-type-operator.stub';
import { TSIndexedAccessTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-indexed-access-type/ts-indexed-access-type.stub';
import { TSFunctionTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-function-type/ts-function-type.stub';
import { TSTypeLiteralStub } from '#gateway/npm/typescript-eslint__utils/ts-type-literal/ts-type-literal.stub';
import { TSUnionTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-union-type/ts-union-type.stub';
import { TSArrayTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-array-type/ts-array-type.stub';
import { TSTypeAnnotationStub } from '#gateway/npm/typescript-eslint__utils/ts-type-annotation/ts-type-annotation.stub';
import { TSTypeReferenceStub } from '#gateway/npm/typescript-eslint__utils/ts-type-reference/ts-type-reference.stub';
import { hasDataObjectLiteralTypeGuard } from './has-data-object-literal-type-guard';
import { TSIntersectionTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-intersection-type/ts-intersection-type.stub';

describe('hasDataObjectLiteralTypeGuard', () => {
  describe('object type literals', () => {
    it('VALID: {literal with a data member} => returns true', () => {
      const node = TSTypeLiteralStub({ code: 'type T = { a: string };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {literal mixing data and functions} => returns true', () => {
      const node = TSTypeLiteralStub({ code: 'type T = { m(): void; a: string };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {literal whose every member is a function} => returns false', () => {
      const node = TSTypeLiteralStub({ code: 'type T = { m(): void; n(): void };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });

    it('EDGE: {empty literal} => returns false', () => {
      const node = TSTypeLiteralStub({ code: 'type T = {  };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });
  });

  describe('containers', () => {
    it('VALID: {union containing a data literal} => returns true', () => {
      const node = TSUnionTypeStub({ code: 'let x: T | { a: string };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {intersection containing a data literal} => returns true', () => {
      const node = TSIntersectionTypeStub({ code: 'let x: T & { a: string };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {union of references only} => returns false', () => {
      const node = TSUnionTypeStub({ code: 'let x: T | null;' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });

    it('VALID: {array of data literals} => returns true', () => {
      const node = TSArrayTypeStub({ code: 'let x: { a: string }[];' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {type annotation wrapping a data literal} => returns true', () => {
      const node = TSTypeAnnotationStub({ code: 'let x: { a: string };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {readonly operator over a data literal array} => returns true', () => {
      const node = TSTypeOperatorStub({ code: 'let x: readonly { a: string }[];' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {Promise of a data literal via typeArguments} => returns true', () => {
      const node = TSTypeReferenceStub({ code: 'let x: T<{ a: string }>;' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {Promise of a method set} => returns false', () => {
      const node = TSTypeReferenceStub({ code: 'let x: T<{ m(): void }>;' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });
  });

  describe('non-shape nodes', () => {
    it('VALID: {indexed access type} => returns false', () => {
      const node = TSIndexedAccessTypeStub({ code: 'let x: Quest["id"];' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });

    it('VALID: {function type returning a data literal} => returns false', () => {
      const node = TSFunctionTypeStub({ code: 'let x: () => { a: string };' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });

    it('EMPTY: {node: undefined} => returns false', () => {
      expect(hasDataObjectLiteralTypeGuard({})).toBe(false);
    });

    it('EMPTY: {node: null} => returns false', () => {
      expect(hasDataObjectLiteralTypeGuard({ node: null })).toBe(false);
    });
  });
});
