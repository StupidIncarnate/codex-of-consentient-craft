import { preEditReferenceStatics } from './pre-edit-reference-statics';

describe('preEditReferenceStatics', () => {
  it('VALID: {preEditReferenceStatics} => names a plain .ts file no override glob matches', () => {
    expect(preEditReferenceStatics).toStrictEqual({
      file: { name: 'dungeonmaster-pre-edit-reference.ts' },
    });
  });
});
