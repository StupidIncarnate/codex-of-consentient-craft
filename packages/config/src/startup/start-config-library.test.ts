import {
  checkArchitectureFolder,
  getAllFrameworks,
  getAllSchemaLibraries,
  getFrameworkPreset,
  resolveConfigForFile,
  validateConfig,
} from './start-config-library';
import { configResolveBroker } from '../brokers/config/resolve/config-resolve-broker';
import { computeAllowedImportsTransformer } from '../transformers/compute-allowed-imports/compute-allowed-imports-transformer';
import type { QuestmaestroConfig } from '../contracts/questmaestro-config/questmaestro-config-contract';
import type { AllowedExternalImports } from '../contracts/folder-config/folder-config-contract';

// Mock dependencies
jest.mock('../brokers/config/resolve/config-resolve-broker');
jest.mock('../transformers/compute-allowed-imports/compute-allowed-imports-transformer');

const mockConfigResolveBroker = jest.mocked(configResolveBroker);
const mockComputeAllowedImportsTransformer = jest.mocked(computeAllowedImportsTransformer);

describe('start-config-library', () => {
  beforeEach(() => {
    mockConfigResolveBroker.mockReset();
    mockComputeAllowedImportsTransformer.mockReset();
  });

  describe('resolveConfigForFile', () => {
    it('VALID: {filePath: "/project/src/file.ts"} => resolves and transforms config', async () => {
      const filePath = '/project/src/file.ts';
      const resolvedConfig: QuestmaestroConfig = {
        framework: 'react',
        routing: 'react-router-dom',
        schema: 'zod',
      };
      const allowedImports: AllowedExternalImports = {
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: ['react-router-dom'],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      mockConfigResolveBroker.mockResolvedValueOnce(resolvedConfig);
      mockComputeAllowedImportsTransformer.mockReturnValueOnce(allowedImports);

      const result = await resolveConfigForFile({ filePath });

      expect(result).toStrictEqual(allowedImports);
      expect(mockConfigResolveBroker).toHaveBeenCalledTimes(1);
      expect(mockConfigResolveBroker).toHaveBeenCalledWith({ filePath });
      expect(mockComputeAllowedImportsTransformer).toHaveBeenCalledTimes(1);
      expect(mockComputeAllowedImportsTransformer).toHaveBeenCalledWith({ config: resolvedConfig });
    });

    it('VALID: {filePath: "/monorepo/packages/api/server.ts"} => handles backend framework config', async () => {
      const filePath = '/monorepo/packages/api/server.ts';
      const resolvedConfig: QuestmaestroConfig = {
        framework: 'express',
        schema: 'joi',
      };
      const allowedImports: AllowedExternalImports = {
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: ['joi'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      };

      mockConfigResolveBroker.mockResolvedValueOnce(resolvedConfig);
      mockComputeAllowedImportsTransformer.mockReturnValueOnce(allowedImports);

      const result = await resolveConfigForFile({ filePath });

      expect(result).toStrictEqual(allowedImports);
      expect(mockConfigResolveBroker).toHaveBeenCalledWith({ filePath });
      expect(mockComputeAllowedImportsTransformer).toHaveBeenCalledWith({ config: resolvedConfig });
    });

    it('ERROR: {filePath: "/nonexistent/file.ts"} => propagates config resolution errors', async () => {
      const filePath = '/nonexistent/file.ts';
      const configError = new Error('Config not found');

      mockConfigResolveBroker.mockRejectedValueOnce(configError);

      await expect(resolveConfigForFile({ filePath })).rejects.toThrow(configError);
      expect(mockConfigResolveBroker).toHaveBeenCalledWith({ filePath });
      expect(mockComputeAllowedImportsTransformer).not.toHaveBeenCalled();
    });

    it('ERROR: {filePath: "/project/invalid.ts"} => propagates transformation errors', async () => {
      const filePath = '/project/invalid.ts';
      const resolvedConfig: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };
      const transformError = new Error('Invalid framework');

      mockConfigResolveBroker.mockResolvedValueOnce(resolvedConfig);
      mockComputeAllowedImportsTransformer.mockImplementationOnce(() => {
        throw transformError;
      });

      await expect(resolveConfigForFile({ filePath })).rejects.toThrow(transformError);
      expect(mockConfigResolveBroker).toHaveBeenCalledWith({ filePath });
      expect(mockComputeAllowedImportsTransformer).toHaveBeenCalledWith({ config: resolvedConfig });
    });
  });

  describe('getFrameworkPreset', () => {
    it('VALID: {framework: "react"} => returns React framework preset', () => {
      const result = getFrameworkPreset({ framework: 'react' });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "express"} => returns Express framework preset', () => {
      const result = getFrameworkPreset({ framework: 'express' });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "node-library"} => returns Node library preset', () => {
      const result = getFrameworkPreset({ framework: 'node-library' });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "cli"} => returns CLI preset', () => {
      const result = getFrameworkPreset({ framework: 'cli' });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: [],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });
  });

  describe('validateConfig', () => {
    describe('valid configs', () => {
      it('VALID: {framework: "react", schema: "zod"} => returns config as-is', () => {
        const config = {
          framework: 'react',
          schema: 'zod',
        };

        const result = validateConfig({ config });

        expect(result).toStrictEqual(config);
      });

      it('VALID: {framework: "express", schema: ["zod", "joi"]} => validates multi-schema config', () => {
        const config = {
          framework: 'express',
          schema: ['zod', 'joi'],
          architecture: {
            overrides: {
              state: { add: ['redis'] },
            },
          },
        };

        const result = validateConfig({ config });

        expect(result).toStrictEqual(config);
      });

      it('VALID: {framework: "monorepo", schema: "yup"} => validates monorepo config', () => {
        const config = {
          framework: 'monorepo',
          schema: 'yup',
          architecture: {
            allowedRootFiles: ['global.d.ts'],
          },
        };

        const result = validateConfig({ config });

        expect(result).toStrictEqual(config);
      });
    });

    describe('invalid configs', () => {
      it('INVALID_CONFIG: {config: null} => throws ZodError for null config', () => {
        expect(() => {
          return validateConfig({ config: null });
        }).toThrow();
      });

      it('INVALID_CONFIG: {config: undefined} => throws ZodError for undefined config', () => {
        expect(() => {
          return validateConfig({ config: undefined });
        }).toThrow();
      });

      it('INVALID_CONFIG: {config: "string"} => throws ZodError for string config', () => {
        expect(() => {
          return validateConfig({ config: 'string' });
        }).toThrow();
      });

      it('INVALID_CONFIG: {config: 123} => throws ZodError for number config', () => {
        expect(() => {
          return validateConfig({ config: 123 });
        }).toThrow();
      });

      it('INVALID_CONFIG: {config: true} => throws ZodError for boolean config', () => {
        expect(() => {
          return validateConfig({ config: true });
        }).toThrow();
      });

      it('INVALID_FRAMEWORK: {framework: missing} => throws ZodError when framework is missing', () => {
        const config = {
          schema: 'zod',
        };

        expect(() => {
          return validateConfig({ config });
        }).toThrow();
      });

      it('INVALID_FRAMEWORK: {framework: null} => throws ZodError when framework is null', () => {
        const config = {
          framework: null,
          schema: 'zod',
        };

        expect(() => {
          return validateConfig({ config });
        }).toThrow();
      });

      it('INVALID_FRAMEWORK: {framework: "unknown"} => throws ZodError for invalid framework', () => {
        const config = {
          framework: 'unknown',
          schema: 'zod',
        };

        expect(() => {
          return validateConfig({ config });
        }).toThrow();
      });

      it('INVALID_SCHEMA: {schema: missing} => throws ZodError when schema is missing', () => {
        const config = {
          framework: 'react',
        };

        expect(() => {
          return validateConfig({ config });
        }).toThrow();
      });

      it('INVALID_SCHEMA: {schema: null} => throws ZodError when schema is null', () => {
        const config = {
          framework: 'react',
          schema: null,
        };

        expect(() => {
          return validateConfig({ config });
        }).toThrow();
      });

      it('INVALID_SCHEMA: {schema: undefined} => throws ZodError when schema is undefined', () => {
        const config = {
          framework: 'react',
          schema: undefined,
        };

        expect(() => {
          return validateConfig({ config });
        }).toThrow();
      });
    });
  });

  describe('getAllFrameworks', () => {
    it('VALID: {} => returns all valid framework options', () => {
      const result = getAllFrameworks();

      expect(result).toStrictEqual([
        'react',
        'vue',
        'angular',
        'svelte',
        'solid',
        'preact',
        'express',
        'fastify',
        'koa',
        'hapi',
        'nestjs',
        'nextjs',
        'nuxtjs',
        'remix',
        'node-library',
        'react-library',
        'cli',
        'ink-cli',
        'monorepo',
      ]);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(19);
    });
  });

  describe('getAllSchemaLibraries', () => {
    it('VALID: {} => returns all valid schema library options', () => {
      const result = getAllSchemaLibraries();

      expect(result).toStrictEqual(['zod', 'yup', 'joi', 'io-ts', 'typebox', 'class-validator']);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(6);
    });
  });

  describe('checkArchitectureFolder', () => {
    describe('valid folders', () => {
      it('VALID: {folder: "widgets"} => returns true for widgets folder', () => {
        const result = checkArchitectureFolder('widgets');

        expect(result).toBe(true);
      });

      it('VALID: {folder: "contracts"} => returns true for contracts folder', () => {
        const result = checkArchitectureFolder('contracts');

        expect(result).toBe(true);
      });

      it('VALID: {folder: "brokers"} => returns true for brokers folder', () => {
        const result = checkArchitectureFolder('brokers');

        expect(result).toBe(true);
      });

      it('VALID: {folder: "startup"} => returns true for startup folder', () => {
        const result = checkArchitectureFolder('startup');

        expect(result).toBe(true);
      });
    });

    describe('invalid folders', () => {
      it('INVALID_FOLDER: {folder: "utils"} => returns false for utils folder', () => {
        const result = checkArchitectureFolder('utils');

        expect(result).toBe(false);
      });

      it('INVALID_FOLDER: {folder: "helpers"} => returns false for helpers folder', () => {
        const result = checkArchitectureFolder('helpers');

        expect(result).toBe(false);
      });

      it('INVALID_FOLDER: {folder: "services"} => returns false for services folder', () => {
        const result = checkArchitectureFolder('services');

        expect(result).toBe(false);
      });

      it('INVALID_FOLDER: {folder: ""} => returns false for empty string', () => {
        const result = checkArchitectureFolder('');

        expect(result).toBe(false);
      });

      it('INVALID_FOLDER: {folder: "WIDGETS"} => returns false for uppercase folder', () => {
        const result = checkArchitectureFolder('WIDGETS');

        expect(result).toBe(false);
      });
    });
  });
});
