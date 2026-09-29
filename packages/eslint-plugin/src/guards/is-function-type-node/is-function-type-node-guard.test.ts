import { TSFunctionTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-function-type/ts-function-type.stub';
import { TSMethodSignatureStub } from '#gateway/npm/typescript-eslint__utils/ts-method-signature/ts-method-signature.stub';
import { TSCallSignatureDeclarationStub } from '#gateway/npm/typescript-eslint__utils/ts-call-signature-declaration/ts-call-signature-declaration.stub';
import { TSConstructSignatureDeclarationStub } from '#gateway/npm/typescript-eslint__utils/ts-construct-signature-declaration/ts-construct-signature-declaration.stub';
import { TSPropertySignatureStub } from '#gateway/npm/typescript-eslint__utils/ts-property-signature/ts-property-signature.stub';
import { TSUnionTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-union-type/ts-union-type.stub';
import { TSIndexSignatureStub } from '#gateway/npm/typescript-eslint__utils/ts-index-signature/ts-index-signature.stub';
import { isFunctionTypeNodeGuard } from './is-function-type-node-guard';

describe('isFunctionTypeNodeGuard', () => {
  describe('function nodes', () => {
    it('VALID: {node type TSFunctionType} => returns true', () => {
      const node = TSFunctionTypeStub({ code: 'let x: () => void;' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });

    it('VALID: {node type TSMethodSignature} => returns true', () => {
      const node = TSMethodSignatureStub({ code: 'type T = { m(): void };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });

    it('VALID: {node type TSCallSignatureDeclaration} => returns true', () => {
      const node = TSCallSignatureDeclarationStub({ code: 'type T = { (): void };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });

    it('VALID: {node type TSConstructSignatureDeclaration} => returns true', () => {
      const node = TSConstructSignatureDeclarationStub({ code: 'type T = { new (): T };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });

    it('VALID: {property signature typed by a function type} => returns true', () => {
      const node = TSPropertySignatureStub({ code: 'type T = { a: () => void };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });

    it('VALID: {property typed function | undefined} => returns true', () => {
      const node = TSPropertySignatureStub({ code: 'type T = { a: (() => void) | undefined };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });
  });

  describe('data nodes', () => {
    it('VALID: {property typed string} => returns false', () => {
      const node = TSPropertySignatureStub({ code: 'type T = { a: string };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {property typed by a named type} => returns false', () => {
      const node = TSPropertySignatureStub({ code: 'type T = { a: T };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {property typed function | string} => returns false', () => {
      const node = TSUnionTypeStub({ code: 'let x: (() => void) | string;' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {union of only undefined and null} => returns false', () => {
      const node = TSUnionTypeStub({ code: 'let x: undefined | null;' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {index signature} => returns false', () => {
      const node = TSIndexSignatureStub({ code: 'type T = { [key: string]: string };' });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isFunctionTypeNodeGuard({})).toBe(false);
    });

    it('EMPTY: {node: null} => returns false', () => {
      expect(isFunctionTypeNodeGuard({ node: null })).toBe(false);
    });
  });
});
