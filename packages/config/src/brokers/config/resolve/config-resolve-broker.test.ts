import { configResolveBroker } from './config-resolve-broker';
import { configFileFindBroker } from '../../config-file/find/config-file-find-broker';
import { configFileLoadBroker } from '../../config-file/load/config-file-load-broker';
import { mergeConfigsTransformer } from '../../../transformers/merge-configs/merge-configs-transformer';
import type { QuestmaestroConfig } from '../../../contracts/questmaestro-config/questmaestro-config-contract';

// Mock dependencies
jest.mock('../../config-file/find/config-file-find-broker');
jest.mock('../../config-file/load/config-file-load-broker');
jest.mock('../../../transformers/merge-configs/merge-configs-transformer');

const mockConfigFileFindBroker = jest.mocked(configFileFindBroker);
const mockConfigFileLoadBroker = jest.mocked(configFileLoadBroker);
const mockMergeConfigsTransformer = jest.mocked(mergeConfigsTransformer);

describe('configResolveBroker', () => {
  beforeEach(() => {
    mockConfigFileFindBroker.mockReset();
    mockConfigFileLoadBroker.mockReset();
    mockMergeConfigsTransformer.mockReset();
  });

  describe('single config resolution', () => {
    it('VALID: {filePath: "/project/src/file.ts"} => resolves single package config', async () => {
      const filePath = '/project/src/file.ts';
      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };

      mockConfigFileFindBroker
        .mockResolvedValueOnce('/project/.questmaestro')
        .mockRejectedValueOnce(new Error('Config not found'));
      mockConfigFileLoadBroker.mockResolvedValueOnce(packageConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(2);
      expect(mockConfigFileFindBroker).toHaveBeenNthCalledWith(1, { startPath: filePath });
      expect(mockConfigFileFindBroker).toHaveBeenNthCalledWith(2, { startPath: '/project' });
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(1);
      expect(mockConfigFileLoadBroker).toHaveBeenCalledWith({
        configPath: '/project/.questmaestro',
      });
      expect(mockMergeConfigsTransformer).toHaveBeenCalledTimes(1);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({ configs: [packageConfig] });
    });

    it('VALID: {filePath: "/monorepo/src/index.ts"} => resolves monorepo root config only', async () => {
      const filePath = '/monorepo/src/index.ts';
      const monorepoConfig: QuestmaestroConfig = {
        framework: 'monorepo',
        schema: 'zod',
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'monorepo',
        schema: 'zod',
      };

      mockConfigFileFindBroker.mockResolvedValueOnce('/monorepo/.questmaestro');
      mockConfigFileLoadBroker.mockResolvedValueOnce(monorepoConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(1);
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(1);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({ configs: [monorepoConfig] });
    });
  });

  describe('monorepo config resolution', () => {
    it('VALID: {filePath: "/monorepo/packages/web/src/app.tsx"} => merges root and package configs', async () => {
      const filePath = '/monorepo/packages/web/src/app.tsx';
      const packageConfig: QuestmaestroConfig = {
        framework: 'react',
        routing: 'react-router-dom',
        schema: 'zod',
      };
      const rootConfig: QuestmaestroConfig = {
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['global.d.ts'],
        },
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'react',
        routing: 'react-router-dom',
        schema: 'zod',
        architecture: {
          allowedRootFiles: ['global.d.ts'],
        },
      };

      mockConfigFileFindBroker
        .mockResolvedValueOnce('/monorepo/packages/web/.questmaestro')
        .mockResolvedValueOnce('/monorepo/.questmaestro');
      mockConfigFileLoadBroker
        .mockResolvedValueOnce(packageConfig)
        .mockResolvedValueOnce(rootConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(2);
      expect(mockConfigFileFindBroker).toHaveBeenNthCalledWith(1, { startPath: filePath });
      expect(mockConfigFileFindBroker).toHaveBeenNthCalledWith(2, {
        startPath: '/monorepo/packages/web',
      });
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(2);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({
        configs: [rootConfig, packageConfig],
      });
    });

    it('VALID: {filePath: "/deep/monorepo/workspace/packages/api/src/server.ts"} => finds multiple parent configs', async () => {
      const filePath = '/deep/monorepo/workspace/packages/api/src/server.ts';
      const packageConfig: QuestmaestroConfig = {
        framework: 'express',
        schema: 'joi',
      };
      const workspaceConfig: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
      };
      const rootConfig: QuestmaestroConfig = {
        framework: 'monorepo',
        schema: 'zod',
        architecture: {
          booleanFunctionPrefixes: ['is', 'has'],
        },
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'express',
        schema: 'joi',
        architecture: {
          booleanFunctionPrefixes: ['is', 'has'],
        },
      };

      mockConfigFileFindBroker
        .mockResolvedValueOnce('/deep/monorepo/workspace/packages/api/.questmaestro')
        .mockResolvedValueOnce('/deep/monorepo/workspace/.questmaestro')
        .mockResolvedValueOnce('/deep/monorepo/.questmaestro');
      mockConfigFileLoadBroker
        .mockResolvedValueOnce(packageConfig)
        .mockResolvedValueOnce(workspaceConfig)
        .mockResolvedValueOnce(rootConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(3);
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(3);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({
        configs: [rootConfig, workspaceConfig, packageConfig],
      });
    });

    it('VALID: {filePath: "/monorepo/packages/shared/utils.ts"} => stops at monorepo root', async () => {
      const filePath = '/monorepo/packages/shared/utils.ts';
      const packageConfig: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'io-ts',
      };
      const rootConfig: QuestmaestroConfig = {
        framework: 'monorepo',
        schema: 'zod',
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'io-ts',
      };

      mockConfigFileFindBroker
        .mockResolvedValueOnce('/monorepo/packages/shared/.questmaestro')
        .mockResolvedValueOnce('/monorepo/.questmaestro');
      mockConfigFileLoadBroker
        .mockResolvedValueOnce(packageConfig)
        .mockResolvedValueOnce(rootConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(2);
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(2);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({
        configs: [rootConfig, packageConfig],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {filePath: "/project/deeply/nested/file.ts"} => handles same config found (no parent)', async () => {
      const filePath = '/project/deeply/nested/file.ts';
      const packageConfig: QuestmaestroConfig = {
        framework: 'vue',
        schema: 'yup',
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'vue',
        schema: 'yup',
      };

      // Same config path returned indicates no parent found
      mockConfigFileFindBroker
        .mockResolvedValueOnce('/project/.questmaestro')
        .mockResolvedValueOnce('/project/.questmaestro');
      mockConfigFileLoadBroker.mockResolvedValueOnce(packageConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(2);
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(1);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({ configs: [packageConfig] });
    });

    it('EDGE: {filePath: "/isolated/project/src/file.ts"} => handles no parent configs found', async () => {
      const filePath = '/isolated/project/src/file.ts';
      const packageConfig: QuestmaestroConfig = {
        framework: 'angular',
        schema: 'class-validator',
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'angular',
        schema: 'class-validator',
      };

      mockConfigFileFindBroker
        .mockResolvedValueOnce('/isolated/project/.questmaestro')
        .mockRejectedValueOnce(new Error('Config not found'));
      mockConfigFileLoadBroker.mockResolvedValueOnce(packageConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(2);
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(1);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({ configs: [packageConfig] });
    });

    it('EDGE: {filePath: "/project/src/file.ts"} => handles parent config load error', async () => {
      const filePath = '/project/src/file.ts';
      const packageConfig: QuestmaestroConfig = {
        framework: 'svelte',
        schema: 'typebox',
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'svelte',
        schema: 'typebox',
      };

      mockConfigFileFindBroker
        .mockResolvedValueOnce('/project/.questmaestro')
        .mockResolvedValueOnce('/root/.questmaestro');
      mockConfigFileLoadBroker
        .mockResolvedValueOnce(packageConfig)
        .mockRejectedValueOnce(new Error('Failed to load config'));
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(2);
      expect(mockConfigFileLoadBroker).toHaveBeenCalledTimes(2);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({ configs: [packageConfig] });
    });

    it('EDGE: {filePath: "/minimal/file.js"} => handles minimal path resolution', async () => {
      const filePath = '/minimal/file.js';
      const packageConfig: QuestmaestroConfig = {
        framework: 'cli',
        schema: 'joi',
      };
      const mergedConfig: QuestmaestroConfig = {
        framework: 'cli',
        schema: 'joi',
      };

      mockConfigFileFindBroker
        .mockResolvedValueOnce('/minimal/.questmaestro')
        .mockRejectedValueOnce(new Error('Config not found'));
      mockConfigFileLoadBroker.mockResolvedValueOnce(packageConfig);
      mockMergeConfigsTransformer.mockReturnValueOnce(mergedConfig);

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(mergedConfig);
      expect(mockConfigFileFindBroker).toHaveBeenCalledTimes(2);
      expect(mockMergeConfigsTransformer).toHaveBeenCalledWith({ configs: [packageConfig] });
    });
  });
});
