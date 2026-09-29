import { hasDataObjectLiteralTypeGuard } from './has-data-object-literal-type-guard';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

const dataMember = TsestreeStub({
  type: 'TSPropertySignature',
  typeAnnotation: TsestreeStub({
    type: 'TSTypeAnnotation',
    typeAnnotation: TsestreeStub({ type: 'TSStringKeyword' }),
  }),
});
const methodMember = TsestreeStub({ type: 'TSMethodSignature' });

describe('hasDataObjectLiteralTypeGuard', () => {
  describe('object type literals', () => {
    it('VALID: {literal with a data member} => returns true', () => {
      const node = TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {literal mixing data and functions} => returns true', () => {
      const node = TsestreeStub({ type: 'TSTypeLiteral', members: [methodMember, dataMember] });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {literal whose every member is a function} => returns false', () => {
      const node = TsestreeStub({ type: 'TSTypeLiteral', members: [methodMember, methodMember] });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });

    it('EDGE: {empty literal} => returns false', () => {
      const node = TsestreeStub({ type: 'TSTypeLiteral', members: [] });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });
  });

  describe('containers', () => {
    it.each(['TSUnionType', 'TSIntersectionType'] as const)(
      'VALID: {%s containing a data literal} => returns true',
      (type) => {
        const node = TsestreeStub({
          type,
          types: [
            TsestreeStub({ type: 'TSTypeReference' }),
            TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] }),
          ],
        });

        expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
      },
    );

    it('VALID: {union of references only} => returns false', () => {
      const node = TsestreeStub({
        type: 'TSUnionType',
        types: [TsestreeStub({ type: 'TSTypeReference' }), TsestreeStub({ type: 'TSNullKeyword' })],
      });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });

    it('VALID: {array of data literals} => returns true', () => {
      const node = TsestreeStub({
        type: 'TSArrayType',
        elementType: TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] }),
      });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {type annotation wrapping a data literal} => returns true', () => {
      const node = TsestreeStub({
        type: 'TSTypeAnnotation',
        typeAnnotation: TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] }),
      });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {readonly operator over a data literal array} => returns true', () => {
      const node = TsestreeStub({
        type: 'TSTypeOperator',
        typeAnnotation: TsestreeStub({
          type: 'TSArrayType',
          elementType: TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] }),
        }),
      });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {Promise of a data literal via typeArguments} => returns true', () => {
      const node = TsestreeStub({
        type: 'TSTypeReference',
        typeArguments: TsestreeStub({
          type: 'TSTypeParameterInstantiation',
          params: [TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] })],
        }),
      });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {reference carrying typeParameters instead of typeArguments} => returns true', () => {
      const node = TsestreeStub({
        type: 'TSTypeReference',
        typeParameters: TsestreeStub({
          type: 'TSTypeParameterInstantiation',
          params: [TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] })],
        }),
      });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(true);
    });

    it('VALID: {Promise of a method set} => returns false', () => {
      const node = TsestreeStub({
        type: 'TSTypeReference',
        typeArguments: TsestreeStub({
          type: 'TSTypeParameterInstantiation',
          params: [TsestreeStub({ type: 'TSTypeLiteral', members: [methodMember] })],
        }),
      });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });
  });

  describe('non-shape nodes', () => {
    it('VALID: {indexed access type} => returns false', () => {
      const node = TsestreeStub({ type: 'TSIndexedAccessType' });

      expect(hasDataObjectLiteralTypeGuard({ node })).toBe(false);
    });

    it('VALID: {function type returning a data literal} => returns false', () => {
      const node = TsestreeStub({
        type: 'TSFunctionType',
        returnType: TsestreeStub({
          type: 'TSTypeAnnotation',
          typeAnnotation: TsestreeStub({ type: 'TSTypeLiteral', members: [dataMember] }),
        }),
      });

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
