import { filepathExtractSegmentsAfterSrcTransformer } from './filepath-extract-segments-after-src-transformer';

describe('filepathExtractSegmentsAfterSrcTransformer', () => {
  it('VALID: {filePath: "/path/src/brokers/rule/foo.ts"} => returns ["brokers", "rule"]', () => {
    expect(
      filepathExtractSegmentsAfterSrcTransformer({ filePath: '/path/src/brokers/rule/foo.ts' }),
    ).toStrictEqual(['brokers', 'rule']);
  });

  it('VALID: {filePath: "/project/src/contracts/user/user-contract.ts"} => returns ["contracts", "user"]', () => {
    expect(
      filepathExtractSegmentsAfterSrcTransformer({
        filePath: '/project/src/contracts/user/user-contract.ts',
      }),
    ).toStrictEqual(['contracts', 'user']);
  });

  it('VALID: {filePath: "/app/src/guards/is-valid/is-valid-guard.ts"} => returns ["guards", "is-valid"]', () => {
    expect(
      filepathExtractSegmentsAfterSrcTransformer({
        filePath: '/app/src/guards/is-valid/is-valid-guard.ts',
      }),
    ).toStrictEqual(['guards', 'is-valid']);
  });

  it('VALID: {filePath: "/src/transformers/foo.ts"} => returns ["transformers"]', () => {
    expect(
      filepathExtractSegmentsAfterSrcTransformer({ filePath: '/src/transformers/foo.ts' }),
    ).toStrictEqual(['transformers']);
  });

  it('EDGE: {filePath: "/src/file.ts"} => returns []', () => {
    expect(
      filepathExtractSegmentsAfterSrcTransformer({ filePath: '/src/file.ts' }),
    ).toStrictEqual([]);
  });

  it('EDGE: {filePath: "/path/without/source/folder/file.ts"} => returns []', () => {
    expect(
      filepathExtractSegmentsAfterSrcTransformer({
        filePath: '/path/without/source/folder/file.ts',
      }),
    ).toStrictEqual([]);
  });

  it('EDGE: {filePath: "/path/src/"} => returns []', () => {
    expect(filepathExtractSegmentsAfterSrcTransformer({ filePath: '/path/src/' })).toStrictEqual(
      [],
    );
  });

  it('EMPTY: {filePath: ""} => returns []', () => {
    expect(filepathExtractSegmentsAfterSrcTransformer({ filePath: '' })).toStrictEqual([]);
  });
});
