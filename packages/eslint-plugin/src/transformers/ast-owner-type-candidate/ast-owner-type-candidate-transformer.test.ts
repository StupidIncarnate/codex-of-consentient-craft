import { TSStringKeywordStub } from '#gateway/npm/typescript-eslint__utils/ts-string-keyword/ts-string-keyword.stub';
import { TSIndexedAccessTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-indexed-access-type/ts-indexed-access-type.stub';
import { TSUnionTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-union-type/ts-union-type.stub';
import { TSTypeReferenceStub } from '#gateway/npm/typescript-eslint__utils/ts-type-reference/ts-type-reference.stub';
import { astOwnerTypeCandidateTransformer } from './ast-owner-type-candidate-transformer';

describe('astOwnerTypeCandidateTransformer', () => {
  it('VALID: {string} => returns the keyword', () => {
    const typeNode = TSStringKeywordStub({ code: 'let x: string;' });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toStrictEqual(typeNode);
  });

  it('VALID: {union of string and undefined} => returns the string member', () => {
    const typeNode = TSUnionTypeStub({ code: 'let x: string | undefined;' });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect({ type: result?.type, range: result?.range }).toStrictEqual({
      type: 'TSStringKeyword',
      range: [7, 13],
    });
  });

  it('VALID: {a plain type reference} => returns the reference', () => {
    const typeNode = TSTypeReferenceStub({ code: 'let x: QuestId;' });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toStrictEqual(typeNode);
  });

  it('EMPTY: {an indexed access} => returns null', () => {
    const typeNode = TSIndexedAccessTypeStub({ code: 'let x: Quest["id"];' });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toBe(null);
  });

  it('EMPTY: {a union with no string or reference} => returns null', () => {
    const typeNode = TSUnionTypeStub({ code: 'let x: undefined | null;' });

    const result = astOwnerTypeCandidateTransformer({ typeNode });

    expect(result).toBe(null);
  });
});
