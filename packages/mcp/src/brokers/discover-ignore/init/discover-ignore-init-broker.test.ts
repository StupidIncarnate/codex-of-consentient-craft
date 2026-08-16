import { discoverIgnoreInitBroker } from './discover-ignore-init-broker';
import { discoverIgnoreInitBrokerProxy } from './discover-ignore-init-broker.proxy';
import { FileContentsStub, GlobPatternStub } from '@dungeonmaster/shared/contracts';

describe('discoverIgnoreInitBroker', () => {
  it('VALID: {.gitignore with dist and worktrees} => merges gitignore over the static rules, deduped', async () => {
    const brokerProxy = discoverIgnoreInitBrokerProxy();

    brokerProxy.setupGitignore({
      contents: FileContentsStub({ value: '# compiled output\ndist\nworktrees/\n' }),
    });

    const result = await discoverIgnoreInitBroker();

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/dist/**' }),
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
      GlobPatternStub({ value: '**/dist' }),
      GlobPatternStub({ value: '**/worktrees/**' }),
    ]);
  });

  it('EMPTY: {no .gitignore on disk} => returns the static rules alone', async () => {
    const brokerProxy = discoverIgnoreInitBrokerProxy();

    brokerProxy.setupNoGitignore();

    const result = await discoverIgnoreInitBroker();

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/dist/**' }),
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });

  it('EMPTY: {.gitignore holding only comments} => returns the static rules alone', async () => {
    const brokerProxy = discoverIgnoreInitBrokerProxy();

    brokerProxy.setupGitignore({
      contents: FileContentsStub({ value: '# nothing but a comment\n\n' }),
    });

    const result = await discoverIgnoreInitBroker();

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/dist/**' }),
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });
});
