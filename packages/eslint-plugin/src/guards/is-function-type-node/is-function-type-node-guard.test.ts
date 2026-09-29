import { isFunctionTypeNodeGuard } from './is-function-type-node-guard';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('isFunctionTypeNodeGuard', () => {
  describe('function nodes', () => {
    it.each([
      'TSFunctionType',
      'TSMethodSignature',
      'TSCallSignatureDeclaration',
      'TSConstructSignatureDeclaration',
    ] as const)('VALID: {node type %s} => returns true', (type) => {
      const node = TsestreeStub({ type });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });

    it('VALID: {property signature typed by a function type} => returns true', () => {
      const node = TsestreeStub({
        type: 'TSPropertySignature',
        typeAnnotation: TsestreeStub({
          type: 'TSTypeAnnotation',
          typeAnnotation: TsestreeStub({ type: 'TSFunctionType' }),
        }),
      });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });

    it('VALID: {property typed function | undefined} => returns true', () => {
      const node = TsestreeStub({
        type: 'TSPropertySignature',
        typeAnnotation: TsestreeStub({
          type: 'TSTypeAnnotation',
          typeAnnotation: TsestreeStub({
            type: 'TSUnionType',
            types: [
              TsestreeStub({ type: 'TSFunctionType' }),
              TsestreeStub({ type: 'TSUndefinedKeyword' }),
            ],
          }),
        }),
      });

      expect(isFunctionTypeNodeGuard({ node })).toBe(true);
    });
  });

  describe('data nodes', () => {
    it('VALID: {property typed string} => returns false', () => {
      const node = TsestreeStub({
        type: 'TSPropertySignature',
        typeAnnotation: TsestreeStub({
          type: 'TSTypeAnnotation',
          typeAnnotation: TsestreeStub({ type: 'TSStringKeyword' }),
        }),
      });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {property typed by a named type} => returns false', () => {
      const node = TsestreeStub({
        type: 'TSPropertySignature',
        typeAnnotation: TsestreeStub({
          type: 'TSTypeAnnotation',
          typeAnnotation: TsestreeStub({ type: 'TSTypeReference' }),
        }),
      });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {property typed function | string} => returns false', () => {
      const node = TsestreeStub({
        type: 'TSUnionType',
        types: [
          TsestreeStub({ type: 'TSFunctionType' }),
          TsestreeStub({ type: 'TSStringKeyword' }),
        ],
      });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {union of only undefined and null} => returns false', () => {
      const node = TsestreeStub({
        type: 'TSUnionType',
        types: [
          TsestreeStub({ type: 'TSUndefinedKeyword' }),
          TsestreeStub({ type: 'TSNullKeyword' }),
        ],
      });

      expect(isFunctionTypeNodeGuard({ node })).toBe(false);
    });

    it('VALID: {index signature} => returns false', () => {
      const node = TsestreeStub({ type: 'TSIndexSignature' });

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
