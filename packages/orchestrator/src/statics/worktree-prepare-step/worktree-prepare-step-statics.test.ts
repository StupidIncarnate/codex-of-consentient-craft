import { worktreePrepareStepStatics } from './worktree-prepare-step-statics';

describe('worktreePrepareStepStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(worktreePrepareStepStatics).toStrictEqual({
      steps: {
        create: 'create',
        nodeModules: 'node_modules',
        build: 'build',
      },
    });
  });
});
