import { gitRemoteRefsStatics } from './git-remote-refs-statics';

describe('gitRemoteRefsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gitRemoteRefsStatics).toStrictEqual({
      originMain: 'origin/main',
      originMaster: 'origin/master',
    });
  });
});
