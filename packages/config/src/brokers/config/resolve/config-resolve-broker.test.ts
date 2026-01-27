import { configResolveBroker } from './config-resolve-broker';
import { configResolveBrokerProxy } from './config-resolve-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { DungeonmasterConfigStub } from '../../../contracts/dungeonmaster-config/dungeonmaster-config.stub';

describe('configResolveBroker', () => {
  describe('single config resolution', () => {
    it('VALID: {filePath: "/project/src/file.ts"} => resolves single package config with no parent', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/project/src/file.ts' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'react',
        schema: 'zod',
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/project/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/project' as never });
      proxy.setupConfigNotFound({ startPath: '/project' });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(packageConfig);
    });

    it('VALID: {filePath: "/monorepo/src/index.ts"} => resolves monorepo root config only', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/monorepo/src/index.ts' });
      const monorepoConfig = DungeonmasterConfigStub({
        framework: 'monorepo',
        schema: 'zod',
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/monorepo/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: monorepoConfig });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(monorepoConfig);
    });
  });

  describe('monorepo config resolution', () => {
    it('VALID: {filePath: "/monorepo/packages/web/src/app.tsx"} => merges root and package configs', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/monorepo/packages/web/src/app.tsx' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'react',
        routing: 'react-router-dom',
        schema: 'zod',
      });
      const rootConfig = DungeonmasterConfigStub({
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['global.d.ts'],
        },
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/monorepo/packages/web/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/monorepo/packages/web' as never });
      proxy.setupConfigFound({
        startPath: '/monorepo/packages/web',
        configPath: '/monorepo/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: rootConfig });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual({
        framework: 'react',
        routing: 'react-router-dom',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['global.d.ts'],
        },
      });
    });

    it('VALID: {filePath: "/deep/monorepo/workspace/packages/api/src/server.ts"} => finds multiple parent configs', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({
        value: '/deep/monorepo/workspace/packages/api/src/server.ts',
      });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'express',
        schema: 'zod',
      });
      const workspaceConfig = DungeonmasterConfigStub({
        framework: 'node-library',
        schema: 'zod',
      });
      const rootConfig = DungeonmasterConfigStub({
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          booleanFunctionPrefixes: ['is', 'has'],
        },
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/deep/monorepo/workspace/packages/api/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/deep/monorepo/workspace/packages/api' as never });
      proxy.setupConfigFound({
        startPath: '/deep/monorepo/workspace/packages/api',
        configPath: '/deep/monorepo/workspace/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: workspaceConfig });
      proxy.setupDirname({ result: '/deep/monorepo/workspace' as never });
      proxy.setupConfigFound({
        startPath: '/deep/monorepo/workspace',
        configPath: '/deep/monorepo/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: rootConfig });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual({
        framework: 'express',
        schema: 'zod',
        architecture: {
          booleanFunctionPrefixes: ['is', 'has'],
        },
      });
    });

    it('VALID: {filePath: "/monorepo/packages/shared/utils.ts"} => stops at monorepo root', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/monorepo/packages/shared/utils.ts' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'node-library',
        schema: 'zod',
      });
      const rootConfig = DungeonmasterConfigStub({
        framework: 'monorepo',
        schema: 'zod',
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/monorepo/packages/shared/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/monorepo/packages/shared' as never });
      proxy.setupConfigFound({
        startPath: '/monorepo/packages/shared',
        configPath: '/monorepo/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: rootConfig });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual({
        framework: 'node-library',
        schema: 'zod',
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {filePath: "/project/deeply/nested/file.ts"} => handles same config found twice (no parent)', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/project/deeply/nested/file.ts' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'vue',
        schema: 'zod',
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/project/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/project' as never });
      proxy.setupConfigFound({
        startPath: '/project',
        configPath: '/project/.dungeonmaster',
      });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(packageConfig);
    });

    it('EDGE: {filePath: "/isolated/project/src/file.ts"} => handles no parent configs found', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/isolated/project/src/file.ts' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'angular',
        schema: 'zod',
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/isolated/project/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/isolated/project' as never });
      proxy.setupConfigNotFound({ startPath: '/isolated/project' });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(packageConfig);
    });

    it('EDGE: {filePath: "/project/src/file.ts"} => handles parent config load error', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/project/src/file.ts' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'svelte',
        schema: 'zod',
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/project/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/project' as never });
      proxy.setupConfigFound({
        startPath: '/project',
        configPath: '/root/.dungeonmaster',
      });
      proxy.setupFileNotFound();

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(packageConfig);
    });

    it('EDGE: {filePath: "/minimal/file.js"} => handles minimal path resolution', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/minimal/file.js' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'cli',
        schema: 'zod',
      });

      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/minimal/.dungeonmaster',
      });
      proxy.setupValidConfig({ config: packageConfig });
      proxy.setupDirname({ result: '/minimal' as never });
      proxy.setupConfigNotFound({ startPath: '/minimal' });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(packageConfig);
    });
  });
});
