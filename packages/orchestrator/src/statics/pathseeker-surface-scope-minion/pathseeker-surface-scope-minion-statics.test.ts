import { pathseekerSurfaceScopeMinionStatics } from './pathseeker-surface-scope-minion-statics';

describe('pathseekerSurfaceScopeMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerSurfaceScopeMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
