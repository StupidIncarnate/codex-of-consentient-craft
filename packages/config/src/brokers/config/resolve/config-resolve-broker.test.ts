import { configResolveBroker } from './config-resolve-broker';
import { configResolveBrokerProxy } from './config-resolve-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
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
        configPath: '/project/src/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/project/src/.dungeonmaster.json',
        config: packageConfig,
      });
      proxy.setupConfigNotFound({ startPath: '/project/src' });

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
        configPath: '/monorepo/src/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/monorepo/src/.dungeonmaster.json',
        config: monorepoConfig,
      });

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
        configPath: '/monorepo/packages/web/src/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/monorepo/packages/web/src/.dungeonmaster.json',
        config: packageConfig,
      });
      proxy.setupConfigFound({
        startPath: '/monorepo/packages/web/src',
        configPath: '/monorepo/packages/web/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/monorepo/packages/web/.dungeonmaster.json',
        config: rootConfig,
      });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual({
        framework: 'react',
        orchestrationMode: 'claude',
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
        configPath: '/deep/monorepo/workspace/packages/api/src/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/deep/monorepo/workspace/packages/api/src/.dungeonmaster.json',
        config: packageConfig,
      });
      proxy.setupConfigFound({
        startPath: '/deep/monorepo/workspace/packages/api/src',
        configPath: '/deep/monorepo/workspace/packages/api/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/deep/monorepo/workspace/packages/api/.dungeonmaster.json',
        config: workspaceConfig,
      });
      proxy.setupConfigFound({
        startPath: '/deep/monorepo/workspace/packages/api',
        configPath: '/deep/monorepo/workspace/packages/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/deep/monorepo/workspace/packages/.dungeonmaster.json',
        config: rootConfig,
      });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual({
        framework: 'express',
        orchestrationMode: 'claude',
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
        configPath: '/monorepo/packages/shared/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/monorepo/packages/shared/.dungeonmaster.json',
        config: packageConfig,
      });
      proxy.setupConfigFound({
        startPath: '/monorepo/packages/shared',
        configPath: '/monorepo/packages/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/monorepo/packages/.dungeonmaster.json',
        config: rootConfig,
      });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual({
        framework: 'node-library',
        orchestrationMode: 'claude',
        schema: 'zod',
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {filePath: "/file.ts"} => handles same config found twice (no parent)', async () => {
      const proxy = configResolveBrokerProxy();

      const filePath = FilePathStub({ value: '/file.ts' });
      const packageConfig = DungeonmasterConfigStub({
        framework: 'vue',
        schema: 'zod',
      });

      // dirname('/file.ts') is '/', and dirname('/') is '/' too, so the parent search that
      // findParentConfigsLayerBroker runs from '/' lands right back on this same config file —
      // the real self-referential case the original identity check exists for.
      proxy.setupConfigFound({
        startPath: filePath,
        configPath: '/.dungeonmaster.json',
      });
      proxy.setupValidConfig({ configPath: '/.dungeonmaster.json', config: packageConfig });
      proxy.setupConfigFound({
        startPath: '/',
        configPath: '/.dungeonmaster.json',
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
        configPath: '/isolated/project/src/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/isolated/project/src/.dungeonmaster.json',
        config: packageConfig,
      });
      proxy.setupConfigNotFound({ startPath: '/isolated/project/src' });

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
        configPath: '/project/src/.dungeonmaster.json',
      });
      proxy.setupValidConfig({
        configPath: '/project/src/.dungeonmaster.json',
        config: packageConfig,
      });
      proxy.setupConfigFound({
        startPath: '/project/src',
        configPath: '/project/.dungeonmaster.json',
      });
      proxy.setupFileNotFound({ configPath: '/project/.dungeonmaster.json' });

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
        configPath: '/minimal/.dungeonmaster.json',
      });
      proxy.setupValidConfig({ configPath: '/minimal/.dungeonmaster.json', config: packageConfig });
      proxy.setupConfigNotFound({ startPath: '/minimal' });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(packageConfig);
    });
  });
});
