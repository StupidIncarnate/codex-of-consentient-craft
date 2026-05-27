import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { projectReferencesSyncBroker } from './project-references-sync-broker';
import { projectReferencesSyncBrokerProxy } from './project-references-sync-broker.proxy';

const ROOT_PATH = AbsoluteFilePathStub({ value: '/repo' });

describe('projectReferencesSyncBroker()', () => {
  describe('no workspaces', () => {
    it('VALID: {no projectFolders} => status in-sync, eligibleCount 0', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      proxy.flushPairReads();
      proxy.setupRootTsconfig({ tsconfigJson: '{}' });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [],
      });

      expect(result).toStrictEqual({
        status: 'in-sync',
        writtenPaths: [],
        eligibleCount: 0,
        eligibleProjectPaths: [],
      });
    });
  });

  describe('two eligible packages, no drift', () => {
    it('VALID: {shared and hooks, refs already correct} => status in-sync, no writes', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const sharedFolder = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });
      const hooksFolder = ProjectFolderStub({ name: 'hooks', path: '/repo/packages/hooks' });

      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/shared","dependencies":{}}',
        pairTsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
      });
      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/hooks","dependencies":{"@dm/shared":"*"}}',
        pairTsconfigJson:
          '{"compilerOptions":{"composite":true},"references":[{"path":"../shared"}]}',
      });
      proxy.flushPairReads();
      proxy.setupRootTsconfig({
        tsconfigJson: '{"references":[{"path":"packages/shared"},{"path":"packages/hooks"}]}',
      });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [sharedFolder, hooksFolder],
      });

      expect(result).toStrictEqual({
        status: 'in-sync',
        writtenPaths: [],
        eligibleCount: 2,
        eligibleProjectPaths: ['/repo/packages/shared', '/repo/packages/hooks'],
      });
      expect(proxy.captureWrites()).toStrictEqual([]);
    });
  });

  describe('two eligible packages, drift in references', () => {
    it('VALID: {hooks missing ref to shared} => status synced, hooks tsconfig written', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const sharedFolder = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });
      const hooksFolder = ProjectFolderStub({ name: 'hooks', path: '/repo/packages/hooks' });

      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/shared","dependencies":{}}',
        pairTsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
      });
      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/hooks","dependencies":{"@dm/shared":"*"}}',
        pairTsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
      });
      proxy.flushPairReads();
      proxy.setupRootTsconfig({
        tsconfigJson: '{"references":[{"path":"packages/shared"},{"path":"packages/hooks"}]}',
      });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [sharedFolder, hooksFolder],
      });

      expect(result).toStrictEqual({
        status: 'synced',
        writtenPaths: [AbsoluteFilePathStub({ value: '/repo/packages/hooks/tsconfig.json' })],
        eligibleCount: 2,
        eligibleProjectPaths: ['/repo/packages/shared', '/repo/packages/hooks'],
      });
      expect(proxy.captureWrites()).toStrictEqual([
        {
          path: '/repo/packages/hooks/tsconfig.json',
          content: `${JSON.stringify({ compilerOptions: { composite: true }, references: [{ path: '../shared' }] }, null, 2)}\n`,
        },
      ]);
    });
  });

  describe('one eligible package missing composite: true', () => {
    it('VALID: {composite absent} => writes composite: true plus references', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const sharedFolder = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      proxy.setupWorkspace({
        tsconfigJson: '{}',
        packageJson: '{"name":"@dm/shared"}',
        pairTsconfigJson: '{}',
      });
      proxy.flushPairReads();
      proxy.setupRootTsconfig({
        tsconfigJson: '{"references":[{"path":"packages/shared"}]}',
      });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [sharedFolder],
      });

      expect(result).toStrictEqual({
        status: 'synced',
        writtenPaths: [AbsoluteFilePathStub({ value: '/repo/packages/shared/tsconfig.json' })],
        eligibleCount: 1,
        eligibleProjectPaths: ['/repo/packages/shared'],
      });
      expect(proxy.captureWrites()).toStrictEqual([
        {
          path: '/repo/packages/shared/tsconfig.json',
          content: `${JSON.stringify({ compilerOptions: { composite: true }, references: [] }, null, 2)}\n`,
        },
      ]);
    });
  });

  describe('cycle in deps', () => {
    it('ERROR: {a depends on b, b depends on a} => status cycle, no writes', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const aFolder = ProjectFolderStub({ name: 'pkg-a', path: '/repo/packages/pkg-a' });
      const bFolder = ProjectFolderStub({ name: 'pkg-b', path: '/repo/packages/pkg-b' });

      proxy.setupWorkspace({
        tsconfigJson: '{}',
        packageJson: '{"name":"@dm/pkg-a","dependencies":{"@dm/pkg-b":"*"}}',
      });
      proxy.setupWorkspace({
        tsconfigJson: '{}',
        packageJson: '{"name":"@dm/pkg-b","dependencies":{"@dm/pkg-a":"*"}}',
      });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [aFolder, bFolder],
      });

      expect(result).toStrictEqual({
        status: 'cycle',
        writtenPaths: [],
        eligibleCount: 0,
        eligibleProjectPaths: ['/repo/packages/pkg-a', '/repo/packages/pkg-b'],
        cycle: ['@dm/pkg-a', '@dm/pkg-b', '@dm/pkg-a'],
      });
      expect(proxy.captureWrites()).toStrictEqual([]);
    });
  });

  describe('checkOnly: true with drift', () => {
    it('VALID: {hooks ref missing, checkOnly: true} => status drift, driftPaths set, no writes', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const sharedFolder = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });
      const hooksFolder = ProjectFolderStub({ name: 'hooks', path: '/repo/packages/hooks' });

      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/shared","dependencies":{}}',
        pairTsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
      });
      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/hooks","dependencies":{"@dm/shared":"*"}}',
        pairTsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
      });
      proxy.flushPairReads();
      proxy.setupRootTsconfig({
        tsconfigJson: '{"references":[{"path":"packages/shared"},{"path":"packages/hooks"}]}',
      });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [sharedFolder, hooksFolder],
        checkOnly: true,
      });

      expect(result).toStrictEqual({
        status: 'drift',
        writtenPaths: [],
        eligibleCount: 2,
        eligibleProjectPaths: ['/repo/packages/shared', '/repo/packages/hooks'],
        driftPaths: [AbsoluteFilePathStub({ value: '/repo/packages/hooks/tsconfig.json' })],
      });
      expect(proxy.captureWrites()).toStrictEqual([]);
    });
  });

  describe('checkOnly: true with no drift', () => {
    it('VALID: {all refs in sync, checkOnly: true} => status in-sync, no writes', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const sharedFolder = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/shared","dependencies":{}}',
        pairTsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
      });
      proxy.flushPairReads();
      proxy.setupRootTsconfig({
        tsconfigJson: '{"references":[{"path":"packages/shared"}]}',
      });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [sharedFolder],
        checkOnly: true,
      });

      expect(result).toStrictEqual({
        status: 'in-sync',
        writtenPaths: [],
        eligibleCount: 1,
        eligibleProjectPaths: ['/repo/packages/shared'],
      });
    });
  });

  describe('workspace with tsconfig.noEmit: true', () => {
    it('VALID: {noEmit: true} => ineligible, not included in pairs, not written', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const noEmitFolder = ProjectFolderStub({ name: 'tools', path: '/repo/packages/tools' });

      proxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"noEmit":true}}',
        packageJson: '{"name":"@dm/tools","dependencies":{}}',
      });
      proxy.flushPairReads();
      proxy.setupRootTsconfig({ tsconfigJson: '{"references":[]}' });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [noEmitFolder],
      });

      expect(result).toStrictEqual({
        status: 'in-sync',
        writtenPaths: [],
        eligibleCount: 0,
        eligibleProjectPaths: [],
      });
      expect(proxy.captureWrites()).toStrictEqual([]);
    });
  });

  describe('workspace with no tsconfig', () => {
    it('VALID: {no tsconfig.json} => ineligible, not included in pairs, not written', async () => {
      const proxy = projectReferencesSyncBrokerProxy();
      const noTscFolder = ProjectFolderStub({ name: 'scripts', path: '/repo/packages/scripts' });

      proxy.setupWorkspace({
        tsconfigJson: null,
        packageJson: '{"name":"@dm/scripts","dependencies":{}}',
      });
      proxy.flushPairReads();
      proxy.setupRootTsconfig({ tsconfigJson: '{"references":[]}' });

      const result = await projectReferencesSyncBroker({
        rootPath: ROOT_PATH,
        projectFolders: [noTscFolder],
      });

      expect(result).toStrictEqual({
        status: 'in-sync',
        writtenPaths: [],
        eligibleCount: 0,
        eligibleProjectPaths: [],
      });
      expect(proxy.captureWrites()).toStrictEqual([]);
    });
  });
});
