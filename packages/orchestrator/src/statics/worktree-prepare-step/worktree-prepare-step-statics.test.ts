import { worktreePrepareStepStatics } from './worktree-prepare-step-statics';

describe('worktreePrepareStepStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(worktreePrepareStepStatics).toStrictEqual({
      steps: {
        create: 'create',
        baseBranch: 'base_branch',
        push: 'push',
        nodeModules: 'node_modules',
        seedDist: 'seed-dist',
        verifyLinks: 'verify-links',
        build: 'build',
      },
      classifications: {
        create: 'git-state',
        base_branch: 'git-state',
        push: 'repairable',
        node_modules: 'repairable',
        'seed-dist': 'git-state',
        'verify-links': 'git-state',
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

    // GIT-STATE, not repairable: an unbuilt MAIN checkout is outside the worktree a spiritmender
    // would be dispatched into, so a repair pass there could never make the seed succeed.
    it('VALID: {steps.seedDist} => classifies git-state, because the unbuilt tree is the main checkout', () => {
      expect(
        worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.seedDist],
      ).toBe('git-state');
    });

    // GIT-STATE for the harsher reason: a worktree whose links leave it grades the MAIN checkout
    // and reports green, so dispatching any session into it corrupts the answer rather than fixing
    // anything.
    it('VALID: {steps.verifyLinks} => classifies git-state, because a leaking worktree grades the wrong tree', () => {
      expect(
        worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.verifyLinks],
      ).toBe('git-state');
    });
  });
});
