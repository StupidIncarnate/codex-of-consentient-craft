import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { WorktreeFlow } from './worktree-flow';
import { chdir, cwd } from '#gateway/node/process';

describe('WorktreeFlow', () => {
  describe('export', () => {
    it('VALID: WorktreeFlow.create => exports an async function', () => {
      expect(WorktreeFlow.create).toStrictEqual(expect.any(Function));
    });
  });

  describe('delegation to responder', () => {
    // The testbed writes a package.json and a .claude/ but no `.dungeonmaster.json`, so the walk-up
    // for a repo root reaches the filesystem root and throws — which is what proves the flow reached
    // the REAL responder rather than something stubbed in front of it.
    it('ERROR: {cwd in a directory with no .dungeonmaster.json above it} => throws ProjectRootNotFoundError from the real responder', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'worktree-flow-1',
      });
      const previousCwd = cwd();
      chdir(testbed.guildPath);

      const error = await WorktreeFlow.create({ name: 'probe' }).catch((thrown: unknown) => thrown);

      chdir(previousCwd);
      testbed.cleanup();

      expect((error as Error).name).toBe('ProjectRootNotFoundError');
    });
  });
});
