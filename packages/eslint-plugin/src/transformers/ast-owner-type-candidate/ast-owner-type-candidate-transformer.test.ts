import { astOwnerTypeCandidateTransformer } from './ast-owner-type-candidate-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astOwnerTypeCandidateTransformer', () => {
  it('VALID: {string} => returns the keyword', () => {
    const typeNode = TsestreeStub({ type: TsestreeNodeType.TSStringKeyword });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toStrictEqual(typeNode);
  });

  it('VALID: {union of string and undefined} => returns the string member', () => {
    const stringNode = TsestreeStub({
      type: TsestreeNodeType.TSStringKeyword,
      range: [1, 7],
    });
    const typeNode = TsestreeStub({
      type: TsestreeNodeType.TSUnionType,
      types: [stringNode, TsestreeStub({ type: TsestreeNodeType.TSUndefinedKeyword })],
    });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toStrictEqual(stringNode);
  });

  it('VALID: {a plain type reference} => returns the reference', () => {
    const typeNode = TsestreeStub({
      type: TsestreeNodeType.TSTypeReference,
      typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'QuestId' }),
    });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toStrictEqual(typeNode);
  });

  it('EMPTY: {an indexed access} => returns null', () => {
    const typeNode = TsestreeStub({ type: TsestreeNodeType.TSIndexedAccessType });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toBe(null);
  });

  it('EMPTY: {a union with no string or reference} => returns null', () => {
    const typeNode = TsestreeStub({
      type: TsestreeNodeType.TSUnionType,
      types: [TsestreeStub({ type: TsestreeNodeType.TSUndefinedKeyword })],
    });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toBe(null);
  });
});
