import { allowedExternalImportsContract } from './allowed-external-imports-contract';
import { AllowedExternalImportsStub } from './allowed-external-imports.stub';

describe('allowedExternalImportsContract', () => {
  describe('valid configurations', () => {
    it('VALID: {frontend structure} => parses successfully', () => {
      const frontendConfig = AllowedExternalImportsStub({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: ['react-router-dom'],
        responders: [],
      });

      const result = allowedExternalImportsContract.parse(frontendConfig);

      expect(result).toStrictEqual({
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
        startup: ['*'],
      });
    });

    it('VALID: {backend structure with null ui folders} => parses successfully', () => {
      const backendConfig = AllowedExternalImportsStub({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
      });

      const result = allowedExternalImportsContract.parse(backendConfig);

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
        startup: ['*'],
      });
    });

    it('VALID: {library structure with limited imports} => parses successfully', () => {
      const libraryConfig = AllowedExternalImportsStub({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
      });

      const result = allowedExternalImportsContract.parse(libraryConfig);

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
        startup: ['*'],
      });
    });

    it('VALID: {stub with all overrides} => parses with custom values', () => {
      const customConfig = AllowedExternalImportsStub({
        widgets: ['vue'],
        bindings: ['vue'],
        state: ['pinia'],
        flows: ['vue-router'],
        responders: ['fastify'],
        contracts: ['joi'],
        brokers: ['amqp'],
        transformers: ['lodash'],
        errors: ['boom'],
        middleware: ['cors'],
        startup: ['dotenv'],
      });

      const result = allowedExternalImportsContract.parse(customConfig);

      expect(result).toStrictEqual(customConfig);
    });
  });

  describe('invalid configurations', () => {
    it('INVALID: {widgets: "react"} => throws validation error', () => {
      expect(() => {
        allowedExternalImportsContract.parse({
          widgets: 'react',
          bindings: ['react'],
          state: [],
          flows: ['express'],
          responders: [],
          contracts: ['zod'],
          brokers: [],
          transformers: [],
          errors: [],
          middleware: [],
          startup: ['*'],
        });
      }).toThrow(/expected array/u);
    });

    it('INVALID: {contracts: null} => throws validation error', () => {
      expect(() => {
        allowedExternalImportsContract.parse({
          widgets: null,
          bindings: null,
          state: [],
          flows: [],
          responders: [],
          contracts: null,
          brokers: [],
          transformers: [],
          errors: [],
          middleware: [],
          startup: ['*'],
        });
      }).toThrow(/expected array/u);
    });

    it('INVALID: {missing required field} => throws validation error', () => {
      expect(() => {
        allowedExternalImportsContract.parse({
          widgets: null,
          bindings: null,
          state: [],
          flows: [],
          responders: [],
          contracts: ['zod'],
          brokers: [],
          transformers: [],
          errors: [],
          middleware: [],
        });
      }).toThrow(/received undefined/u);
    });
  });
});
