import { worktreePrepareStepStatics } from './worktree-prepare-step-statics';

describe('worktreePrepareStepStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(worktreePrepareStepStatics).toStrictEqual({
      steps: {
        create: 'create',
        baseBranch: 'base_branch',
        push: 'push',
        nodeModules: 'node_modules',
        build: 'build',
      },
      classifications: {
        create: 'git-state',
        base_branch: 'git-state',
        push: 'repairable',
        node_modules: 'repairable',
        build: 'repairable',
      },
    });
  });

  describe('classifications are keyed by the step VALUE', () => {
    it('VALID: {steps.build} => indexes straight into classifications', () => {
      expect(
        worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.build],
      ).toBe('repairable');
    });

    it('VALID: {steps.nodeModules} => indexes straight into classifications', () => {
      expect(
        worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.nodeModules],
      ).toBe('repairable');
    });

    it('VALID: {steps.create} => indexes straight into classifications', () => {
      expect(
        worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.create],
      ).toBe('git-state');
    });

    it('VALID: {steps.baseBranch} => indexes straight into classifications', () => {
      expect(
        worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.baseBranch],
      ).toBe('git-state');
    });

    // REPAIRABLE rather than `git-state`, and the difference decides whether a quest survives a
    // network blip: a failed push leaves a fully built worktree holding every commit, so a
    // spiritmender has somewhere to work and the pt N carve retries only the publication.
    it('VALID: {steps.push} => classifies repairable, because a failed push leaves the worktree intact', () => {
      expect(
        worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.push],
      ).toBe('repairable');
    });
  });
});
