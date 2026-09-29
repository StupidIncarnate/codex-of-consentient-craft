import { ownerIndexStatics } from './owner-index-statics';

describe('ownerIndexStatics', () => {
  it('VALID: {objectRootNames} => names the three zod object roots', () => {
    expect(ownerIndexStatics.objectRootNames).toStrictEqual([
      'object',
      'strictObject',
      'looseObject',
    ]);
  });
});
