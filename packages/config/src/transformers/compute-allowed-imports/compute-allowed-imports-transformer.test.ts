import { computeAllowedImportsTransformer } from './compute-allowed-imports-transformer';
import { QuestmaestroConfigStub } from '../../contracts/questmaestro-config/questmaestro-config.stub';

describe('computeAllowedImportsTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {framework: "react", schema: "zod"} => returns complete config with schema array', () => {
      const config = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
      });

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

    it('VALID: {framework: "express", schema: ["zod"]} => returns complete config with schema array unchanged', () => {
      const config = QuestmaestroConfigStub({
        framework: 'express',
        schema: ['zod'],
      });

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

    it('VALID: {framework: "react", routing: "vue-router"} => adds routing to flows when not already present', () => {
      const config = QuestmaestroConfigStub({
        framework: 'react',
        routing: 'vue-router',
        schema: 'zod',
      });

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
      const config = QuestmaestroConfigStub({
        framework: 'express',
        routing: 'fastify',
        schema: 'zod',
      });

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
      const config = QuestmaestroConfigStub({
        framework: 'express',
        routing: 'express',
        schema: 'zod',
      });

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
      const config = QuestmaestroConfigStub({
        framework: 'node-library',
        schema: 'zod',
      });

      const result = computeAllowedImportsTransformer({ config });

      expect(result.flows).toBeNull();
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

    it('VALID: {framework: "react", architecture: {overrides: {widgets: {add: ["custom-lib"]} as any}}} => applies overrides correctly', () => {
      const config = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
        architecture: {
          overrides: {
            widgets: {
              add: ['custom-lib'],
            },
          },
        },
      });

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
      const config = QuestmaestroConfigStub({
        framework: 'react',
        schema: 'zod',
      });

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
      const config = QuestmaestroConfigStub({
        framework: 'node-library',
        routing: 'express',
        schema: 'zod',
      });

      const result = computeAllowedImportsTransformer({ config });

      // Routing should not be added when flows is null
      expect(result.flows).toBeNull();
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
});
