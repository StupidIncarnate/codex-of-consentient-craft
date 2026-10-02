import { discoverIgnoreInitWalkUpLayerBroker } from './discover-ignore-init-walk-up-layer-broker';
import { discoverIgnoreInitWalkUpLayerBrokerProxy } from './discover-ignore-init-walk-up-layer-broker.proxy';

describe('discoverIgnoreInitWalkUpLayerBroker', () => {
  it('VALID: {.gitignore at startPath} => returns contents immediately', async () => {
    const proxy = discoverIgnoreInitWalkUpLayerBrokerProxy();

    proxy.setupGitignoreAt({
      dirPath: '/repo',
      contents: 'node_modules\ndist\n',
    });

    const result = await discoverIgnoreInitWalkUpLayerBroker({ startPath: '/repo' });

    expect(result).toBe('node_modules\ndist\n');
  });

  it('VALID: {.gitignore in parent directory} => walks up and returns contents', async () => {
    const proxy = discoverIgnoreInitWalkUpLayerBrokerProxy();

    proxy.setupGitignoreFoundInParent({
      startPath: '/repo/.agents/plugins/dungeonmaster',
      gitignoreDir: '/repo',
      contents: 'worktrees/\n',
    });

    const result = await discoverIgnoreInitWalkUpLayerBroker({
      startPath: '/repo/.agents/plugins/dungeonmaster',
    });

    expect(result).toBe('worktrees/\n');
  });

  it('EMPTY: {.dungeonmaster.json encountered before .gitignore} => stops climbing and returns null', async () => {
    const proxy = discoverIgnoreInitWalkUpLayerBrokerProxy();

    proxy.setupProjectBoundaryAt({
      startPath: '/repo/.agents/plugins/dungeonmaster',
      boundaryDir: '/repo',
    });

    const result = await discoverIgnoreInitWalkUpLayerBroker({
      startPath: '/repo/.agents/plugins/dungeonmaster',
    });

    expect(result).toBe(null);
  });

  it('EMPTY: {filesystem root reached with no .gitignore} => returns null', async () => {
    const proxy = discoverIgnoreInitWalkUpLayerBrokerProxy();

    proxy.setupNoGitignore({ startPath: '/a/b' });

    const result = await discoverIgnoreInitWalkUpLayerBroker({
      startPath: '/a/b',
    });

    expect(result).toBe(null);
  });
});
