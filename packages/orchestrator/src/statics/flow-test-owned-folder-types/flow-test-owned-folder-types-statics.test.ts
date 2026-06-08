import { flowTestOwnedFolderTypesStatics } from './flow-test-owned-folder-types-statics';

describe('flowTestOwnedFolderTypesStatics', () => {
  it('VALID: exported value => is flows and startup', () => {
    expect(flowTestOwnedFolderTypesStatics).toStrictEqual({
      value: ['flows', 'startup'],
    });
  });
});
