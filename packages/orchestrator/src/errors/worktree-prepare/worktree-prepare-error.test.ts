import { WorktreePrepareError } from './worktree-prepare-error';

describe('WorktreePrepareError', () => {
  describe('constructor()', () => {
    it('VALID: {step: "create", detail: worktree path} => sets name and full message', () => {
      const error = new WorktreePrepareError({
        step: 'create',
        detail: '/repo/worktrees/add-auth-7bc217a1',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: 'Worktree preparation failed at create: /repo/worktrees/add-auth-7bc217a1',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WorktreePrepareError);
    });

    it('VALID: {step: "node_modules", detail: underlying error} => sets name and full message', () => {
      const error = new WorktreePrepareError({
        step: 'node_modules',
        detail: 'npm install exited with code 1',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: 'Worktree preparation failed at node_modules: npm install exited with code 1',
      });
    });

    it('VALID: {step: "build", detail: underlying error} => sets name and full message', () => {
      const error = new WorktreePrepareError({ step: 'build', detail: 'tsc exited with code 2' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: 'Worktree preparation failed at build: tsc exited with code 2',
      });
    });
  });
});
