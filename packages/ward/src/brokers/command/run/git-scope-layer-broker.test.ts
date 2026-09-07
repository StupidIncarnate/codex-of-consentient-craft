import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { gitScopeLayerBroker } from './git-scope-layer-broker';
import { gitScopeLayerBrokerProxy } from './git-scope-layer-broker.proxy';

describe('gitScopeLayerBroker', () => {
  describe('no git scope flag', () => {
    it('VALID: {neither committed nor uncommitted} => returns the config untouched and runs no git command', async () => {
      gitScopeLayerBrokerProxy();

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ only: ['lint'] }));
    });
  });

  describe('uncommitted flag', () => {
    it('VALID: {uncommitted: true, one edited and one new source file} => sets passthrough to both', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupUncommittedFiles({
        trackedOutput: 'packages/ward/src/a.ts\n',
        untrackedOutput: 'packages/ward/src/b.tsx\n',
      });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ uncommitted: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          uncommitted: true,
          passthrough: ['packages/ward/src/a.ts', 'packages/ward/src/b.tsx'],
        }),
      );
    });

    it('VALID: {uncommitted: true, set mixes source and docs} => passthrough keeps only the source files', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupUncommittedFiles({
        trackedOutput: 'packages/ward/src/a.ts\nREADME.md\n',
        untrackedOutput: 'package.json\npackages/ward/src/b.mjs\n',
      });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ uncommitted: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          uncommitted: true,
          passthrough: ['packages/ward/src/a.ts', 'packages/ward/src/b.mjs'],
        }),
      );
    });

    it('EMPTY: {uncommitted: true, clean working tree} => leaves passthrough unset', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupUncommittedFiles({ trackedOutput: '', untrackedOutput: '' });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ uncommitted: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ uncommitted: true }));
    });

    it('EMPTY: {uncommitted: true, working tree holds docs only} => leaves passthrough unset', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupUncommittedFiles({
        trackedOutput: 'README.md\n',
        untrackedOutput: 'docs/design.md\n',
      });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ uncommitted: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ uncommitted: true }));
    });
  });

  describe('committed flag', () => {
    it('VALID: {committed: true, one committed source file} => sets passthrough to that file', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupCommittedFiles({ diffOutput: 'packages/ward/src/committed.ts\n' });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ committed: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          committed: true,
          passthrough: ['packages/ward/src/committed.ts'],
        }),
      );
    });

    it('EMPTY: {committed: true, nothing committed since the base} => leaves passthrough unset', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupCommittedFiles({ diffOutput: '' });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ committed: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ committed: true }));
    });
  });

  describe('both flags together', () => {
    it('VALID: {committed and uncommitted} => passthrough is the union, committed files first', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupCommittedFiles({ diffOutput: 'packages/ward/src/landed.ts\n' });
      proxy.setupUncommittedFiles({
        trackedOutput: 'packages/ward/src/edited.ts\n',
        untrackedOutput: 'packages/ward/src/brand-new.ts\n',
      });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ committed: true, uncommitted: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          committed: true,
          uncommitted: true,
          passthrough: [
            'packages/ward/src/landed.ts',
            'packages/ward/src/edited.ts',
            'packages/ward/src/brand-new.ts',
          ],
        }),
      );
    });

    // A file committed on this branch AND edited again since sits in both readings. Handed to a
    // check runner twice it is reported twice.
    it('EDGE: {a file in both readings} => appears once, at its committed position', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupCommittedFiles({
        diffOutput: 'packages/ward/src/both.ts\npackages/ward/src/landed.ts\n',
      });
      proxy.setupUncommittedFiles({
        trackedOutput: 'packages/ward/src/both.ts\n',
        untrackedOutput: '',
      });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ committed: true, uncommitted: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        WardConfigStub({
          committed: true,
          uncommitted: true,
          passthrough: ['packages/ward/src/both.ts', 'packages/ward/src/landed.ts'],
        }),
      );
    });

    it('EMPTY: {committed and uncommitted, both resolve to nothing} => leaves passthrough unset', async () => {
      const proxy = gitScopeLayerBrokerProxy();
      proxy.setupCommittedFiles({ diffOutput: '' });
      proxy.setupUncommittedFiles({ trackedOutput: '', untrackedOutput: '' });

      const result = await gitScopeLayerBroker({
        config: WardConfigStub({ committed: true, uncommitted: true }),
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(WardConfigStub({ committed: true, uncommitted: true }));
    });
  });
});
