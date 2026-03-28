import { workspaceGlobStatics } from './workspace-glob-statics';

describe('workspaceGlobStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(workspaceGlobStatics).toStrictEqual({
      wildcardSuffix: '/*',
      wildcardSuffixLength: 2,
    });
  });
});
