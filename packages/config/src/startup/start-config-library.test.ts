import {
  checkArchitectureFolder,
  getAllFrameworks,
  getAllSchemaLibraries,
  getFrameworkPreset,
  validateConfig,
} from './start-config-library';
import { QuestmaestroConfigStub } from '../contracts/questmaestro-config/questmaestro-config.stub';

describe('start-config-library', () => {
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
        const config = QuestmaestroConfigStub();

        const result = validateConfig({ config });

        expect(result).toStrictEqual(config);
      });

      it('VALID: {framework: "express", schema: ["zod"]} => validates multi-schema config', () => {
        const config = QuestmaestroConfigStub({
          framework: 'express',
          schema: ['zod'],
        });

        const result = validateConfig({ config });

        expect(result).toStrictEqual(config);
      });
    });

    describe('invalid configs', () => {
      it('INVALID_CONFIG: {config: null} => throws ZodError for null config', () => {
        expect(() => {
          return validateConfig({ config: null as never });
        }).toThrow(/required/u);
      });

      it('INVALID_CONFIG: {config: undefined} => throws ZodError for undefined config', () => {
        expect(() => {
          return validateConfig({ config: undefined as never });
        }).toThrow(/required/u);
      });

      it('INVALID_CONFIG: {config: "string"} => throws ZodError for string config', () => {
        expect(() => {
          return validateConfig({ config: 'string' as never });
        }).toThrow(/expected.*object/iu);
      });

      it('INVALID_CONFIG: {config: 123} => throws ZodError for number config', () => {
        expect(() => {
          return validateConfig({ config: 123 as never });
        }).toThrow(/expected.*object/iu);
      });

      it('INVALID_CONFIG: {config: true} => throws ZodError for boolean config', () => {
        expect(() => {
          return validateConfig({ config: true as never });
        }).toThrow(/expected.*object/iu);
      });

      it('INVALID_FRAMEWORK: {framework: missing} => throws ZodError when framework is missing', () => {
        expect(() => {
          return validateConfig({ config: { schema: 'zod' } as never });
        }).toThrow(/required/u);
      });

      it('INVALID_FRAMEWORK: {framework: null} => throws ZodError when framework is null', () => {
        expect(() => {
          return validateConfig({
            config: { framework: null, schema: 'zod' } as never,
          });
        }).toThrow(/required/u);
      });

      it('INVALID_FRAMEWORK: {framework: "unknown"} => throws ZodError for invalid framework', () => {
        expect(() => {
          return validateConfig({
            config: QuestmaestroConfigStub({ framework: 'unknown' as never }),
          });
        }).toThrow(/invalid.*enum/iu);
      });

      it('INVALID_SCHEMA: {schema: missing} => throws ZodError when schema is missing', () => {
        expect(() => {
          return validateConfig({ config: { framework: 'react' } as never });
        }).toThrow(/required/u);
      });

      it('INVALID_SCHEMA: {schema: null} => throws ZodError when schema is null', () => {
        expect(() => {
          return validateConfig({
            config: { framework: 'react', schema: null } as never,
          });
        }).toThrow(/required/u);
      });

      it('INVALID_SCHEMA: {schema: undefined} => throws ZodError when schema is undefined', () => {
        expect(() => {
          return validateConfig({ config: { framework: 'react' } as never });
        }).toThrow(/required/u);
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
      expect(result).toHaveLength(19);
    });
  });

  describe('getAllSchemaLibraries', () => {
    it('VALID: {} => returns all valid schema library options', () => {
      const result = getAllSchemaLibraries();

      expect(result).toStrictEqual(['zod']);
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
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
