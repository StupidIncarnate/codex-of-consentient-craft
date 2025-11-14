import { folderConfigContract } from './folder-config-contract';
import { FolderConfigStub } from './folder-config.stub';

describe('folderConfigContract', () => {
  describe('valid configurations', () => {
    it('VALID: {frontend structure} => parses successfully', () => {
      const frontendConfig = FolderConfigStub({
        widgets: ['react', 'react-dom'],
        bindings: ['react', 'react-dom'],
        state: ['react', 'react-dom'],
        flows: ['react-router-dom'],
        responders: [],
      });

      const result = folderConfigContract.parse(frontendConfig);

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
        adapters: ['*'],
        startup: ['*'],
      });
    });

    it('VALID: {backend structure with null ui folders} => parses successfully', () => {
      const backendConfig = FolderConfigStub({
        widgets: null,
        bindings: null,
        state: [],
        flows: ['express'],
        responders: [],
      });

      const result = folderConfigContract.parse(backendConfig);

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

    it('VALID: {library structure with limited imports} => parses successfully', () => {
      const libraryConfig = FolderConfigStub({
        widgets: null,
        bindings: null,
        state: [],
        flows: null,
        responders: null,
      });

      const result = folderConfigContract.parse(libraryConfig);

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

    it('VALID: {stub with all overrides} => parses with custom values', () => {
      const customConfig = FolderConfigStub({
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
        adapters: ['axios'],
        startup: ['dotenv'],
      });

      const result = folderConfigContract.parse(customConfig);

      expect(result).toStrictEqual(customConfig);
    });
  });

  describe('invalid configurations', () => {
    it('INVALID_TYPE: {widgets: "react"} => throws validation error', () => {
      expect(() => {
        folderConfigContract.parse({
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
          adapters: ['*'],
          startup: ['*'],
        });
      }).toThrow(/Expected array/u);
    });

    it('INVALID_TYPE: {contracts: null} => throws validation error', () => {
      expect(() => {
        folderConfigContract.parse({
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
          adapters: ['*'],
          startup: ['*'],
        });
      }).toThrow(/Expected array/u);
    });

    it('INVALID_MISSING: {missing required field} => throws validation error', () => {
      expect(() => {
        folderConfigContract.parse({
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
          adapters: ['*'],
        });
      }).toThrow(/Required/u);
    });
  });
});
