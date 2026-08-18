import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { commandRunLayerGitScopeBroker } from './command-run-layer-git-scope-broker';
import { commandRunLayerGitScopeBrokerProxy } from './command-run-layer-git-scope-broker.proxy';

describe('commandRunLayerGitScopeBroker', () => {
  describe('no git scope flag', () => {
    it('VALID: {neither staged nor changed} => returns the config untouched and runs no git command', async () => {
      commandRunLayerGitScopeBrokerProxy();

      const result = await commandRunLayerGitScopeBroker({
        config: WardConfigStub({ only: ['lint'] }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ only: ['lint'] }));
    });
  });

  describe('staged flag', () => {
    it('VALID: {staged: true, two unpushed source files} => sets passthrough to those files', async () => {
      const proxy = commandRunLayerGitScopeBrokerProxy();
      proxy.setupUnpushedFiles({
        diffOutput: 'packages/ward/src/a.ts\npackages/ward/src/b.tsx\n',
      });

      const result = await commandRunLayerGitScopeBroker({
        config: WardConfigStub({ staged: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          staged: true,
          passthrough: ['packages/ward/src/a.ts', 'packages/ward/src/b.tsx'],
        }),
      );
    });

    it('VALID: {staged: true, unpushed set mixes source and docs} => passthrough keeps only the source files', async () => {
      const proxy = commandRunLayerGitScopeBrokerProxy();
      proxy.setupUnpushedFiles({
        diffOutput: 'packages/ward/src/a.ts\nREADME.md\npackage.json\npackages/ward/src/b.mjs\n',
      });

      const result = await commandRunLayerGitScopeBroker({
        config: WardConfigStub({ staged: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          staged: true,
          passthrough: ['packages/ward/src/a.ts', 'packages/ward/src/b.mjs'],
        }),
      );
    });

    it('EMPTY: {staged: true, nothing unpushed} => leaves passthrough unset', async () => {
      const proxy = commandRunLayerGitScopeBrokerProxy();
      proxy.setupUnpushedFiles({ diffOutput: '' });

      const result = await commandRunLayerGitScopeBroker({
        config: WardConfigStub({ staged: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ staged: true }));
    });

    it('EMPTY: {staged: true, unpushed set is docs only} => leaves passthrough unset', async () => {
      const proxy = commandRunLayerGitScopeBrokerProxy();
      proxy.setupUnpushedFiles({ diffOutput: 'README.md\ndocs/design.md\n' });

      const result = await commandRunLayerGitScopeBroker({
        config: WardConfigStub({ staged: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ staged: true }));
    });
  });

  describe('changed flag', () => {
    it('VALID: {changed: true, one changed source file} => sets passthrough to that file', async () => {
      const proxy = commandRunLayerGitScopeBrokerProxy();
      proxy.setupChangedFiles({ diffOutput: 'packages/ward/src/changed.ts\n' });

      const result = await commandRunLayerGitScopeBroker({
        config: WardConfigStub({ changed: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          changed: true,
          passthrough: ['packages/ward/src/changed.ts'],
        }),
      );
    });

    it('EMPTY: {changed: true, nothing changed} => leaves passthrough unset', async () => {
      const proxy = commandRunLayerGitScopeBrokerProxy();
      proxy.setupChangedFiles({ diffOutput: '' });

      const result = await commandRunLayerGitScopeBroker({
        config: WardConfigStub({ changed: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ changed: true }));
    });
  });
});
