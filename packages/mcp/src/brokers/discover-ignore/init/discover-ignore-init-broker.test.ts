import { discoverIgnoreInitBroker } from './discover-ignore-init-broker';
import { discoverIgnoreInitBrokerProxy } from './discover-ignore-init-broker.proxy';

describe('discoverIgnoreInitBroker', () => {
  it('VALID: {.gitignore with dist and worktrees} => merges gitignore over the static rules, deduped', async () => {
    const brokerProxy = discoverIgnoreInitBrokerProxy();

    brokerProxy.setupGitignore({
      contents: '# compiled output\ndist\nworktrees/\n',
    });

    const result = await discoverIgnoreInitBroker();

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/dist',
      '**/worktrees/**',
    ]);
  });

  it('EMPTY: {no .gitignore on disk} => returns the static rules alone', async () => {
    const brokerProxy = discoverIgnoreInitBrokerProxy();

    brokerProxy.setupNoGitignore();

    const result = await discoverIgnoreInitBroker();

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ]);
  });

  it('EMPTY: {.gitignore holding only comments} => returns the static rules alone', async () => {
    const brokerProxy = discoverIgnoreInitBrokerProxy();

    brokerProxy.setupGitignore({
      contents: '# nothing but a comment\n\n',
    });

    const result = await discoverIgnoreInitBroker();

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ]);
  });
});
