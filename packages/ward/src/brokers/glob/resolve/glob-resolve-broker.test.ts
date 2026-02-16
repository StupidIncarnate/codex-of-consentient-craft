import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { globResolveBroker } from './glob-resolve-broker';
import { globResolveBrokerProxy } from './glob-resolve-broker.proxy';

describe('globResolveBroker', () => {
  describe('matching files', () => {
    it('VALID: {pattern matches multiple files} => returns GitRelativePath array', async () => {
      const proxy = globResolveBrokerProxy();
      proxy.setupMatches({ output: 'src/a.ts\nsrc/b.ts\n' });

      const result = await globResolveBroker({
        pattern: '**/*.ts',
        basePath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'src/a.ts' }),
        GitRelativePathStub({ value: 'src/b.ts' }),
      ]);
    });

    it('VALID: {pattern matches single file} => returns single-element array', async () => {
      const proxy = globResolveBrokerProxy();
      proxy.setupMatches({ output: 'src/index.ts\n' });

      const result = await globResolveBroker({
        pattern: 'src/index.ts',
        basePath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'src/index.ts' })]);
    });
  });

  describe('no matches', () => {
    it('EMPTY: {pattern matches nothing} => returns empty array', async () => {
      const proxy = globResolveBrokerProxy();
      proxy.setupNoMatches();

      const result = await globResolveBroker({
        pattern: '**/*.xyz',
        basePath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('command failure', () => {
    it('ERROR: {git ls-files fails} => returns empty array', async () => {
      const proxy = globResolveBrokerProxy();
      proxy.setupFails();

      const result = await globResolveBroker({
        pattern: '**/*.ts',
        basePath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
