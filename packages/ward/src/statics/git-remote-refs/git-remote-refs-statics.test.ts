import { gitRemoteRefsStatics } from './git-remote-refs-statics';

describe('gitRemoteRefsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gitRemoteRefsStatics).toStrictEqual({
      upstreamAlias: '@{upstream}',
      originMain: 'origin/main',
      originMaster: 'origin/master',
    });
  });
});
