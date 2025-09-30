import { computeAllowedImportsTransformer } from './compute-allowed-imports-transformer';
import { InvalidFrameworkError } from '../../errors/invalid-framework/invalid-framework-error';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';

describe('computeAllowedImportsTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {framework: "react", schema: "zod"} => returns complete config with schema array', () => {
      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "express", schema: ["zod", "yup"]} => returns complete config with schema array unchanged', () => {
      const config: QuestmaestroConfig = {
        framework: 'express',
        schema: ['zod', 'yup'],
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: ['zod', 'yup'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "react", routing: "vue-router"} => adds routing to flows when not already present', () => {
      const config: QuestmaestroConfig = {
        framework: 'react',
        routing: 'vue-router',
        schema: 'zod',
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: ['vue-router'],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "express", routing: "fastify"} => adds routing to flows when not already present', () => {
      const config: QuestmaestroConfig = {
        framework: 'express',
        routing: 'fastify',
        schema: 'zod',
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express', 'fastify'],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "express", routing: "express"} => does not duplicate routing when already in flows', () => {
      const config: QuestmaestroConfig = {
        framework: 'express',
        routing: 'express',
        schema: 'zod',
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "node-library"} => handles null flows correctly', () => {
      const config: QuestmaestroConfig = {
        framework: 'node-library',
        schema: 'zod',
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result.flows).toBe(null);
      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {framework: "react", architecture: {overrides: {widgets: {add: ["custom-lib"]}}}} => applies overrides correctly', () => {
      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: {
              add: ['custom-lib'],
            },
          },
        },
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom', 'custom-lib'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {framework: "react"} => handles missing routing property', () => {
      const config: QuestmaestroConfig = {
        framework: 'react',
        schema: 'zod',
      };

      const result = computeAllowedImportsTransformer({ config });

      expect(result.flows).toStrictEqual([]);
      expect(result).toStrictEqual({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: [],
        responders: [],
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('EDGE: {framework: "node-library", routing: "express"} => does not add routing when flows is null', () => {
      const config: QuestmaestroConfig = {
        framework: 'node-library',
        routing: 'express',
        schema: 'zod',
      };

      const result = computeAllowedImportsTransformer({ config });

      // Routing should not be added when flows is null
      expect(result.flows).toBe(null);
      expect(result).toStrictEqual({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
        contracts: ['zod'],
        brokers: [],
        transformers: [],
        errors: [],
        middleware: [],
        adapters: ['*'],
        startup: ['*'],
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {framework: "unknown"} => throws InvalidFrameworkError', () => {
      const config = {
        framework: 'unknown' as unknown,
        schema: 'zod',
      } as QuestmaestroConfig;

      expect(() => {
        return computeAllowedImportsTransformer({ config });
      }).toThrow(new InvalidFrameworkError({ framework: 'unknown' }));
    });

    it('ERROR: {framework: null} => throws InvalidFrameworkError', () => {
      const config = {
        framework: null as unknown,
        schema: 'zod',
      } as QuestmaestroConfig;

      expect(() => {
        return computeAllowedImportsTransformer({ config });
      }).toThrow(new InvalidFrameworkError({ framework: null }));
    });

    it('ERROR: {framework: undefined} => throws InvalidFrameworkError', () => {
      const config = {
        framework: undefined as unknown,
        schema: 'zod',
      } as QuestmaestroConfig;

      expect(() => {
        return computeAllowedImportsTransformer({ config });
      }).toThrow(new InvalidFrameworkError({ framework: undefined }));
    });
  });
});
