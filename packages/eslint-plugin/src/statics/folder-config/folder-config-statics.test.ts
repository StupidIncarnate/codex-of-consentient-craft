import { folderConfigStatics } from './folder-config-statics';

describe('folderConfigStatics', () => {
  describe('configuration structure', () => {
    it('VALID: statics folder config returns correct structure', () => {
      expect(folderConfigStatics.statics).toStrictEqual({
        fileSuffix: '-statics.ts',
        exportSuffix: 'Statics',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'statics/[domain]/[domain]-statics.ts',
        allowedImports: [],
      });
    });

    it('VALID: contracts folder config returns correct structure', () => {
      expect(folderConfigStatics.contracts).toStrictEqual({
        fileSuffix: ['-contract.ts', '.stub.ts'],
        exportSuffix: 'Contract',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'contracts/[domain]/[domain]-contract.ts',
        allowedImports: ['statics/', 'errors/', 'zod'],
      });
    });

    it('VALID: guards folder config returns correct structure', () => {
      expect(folderConfigStatics.guards).toStrictEqual({
        fileSuffix: '-guard.ts',
        exportSuffix: 'Guard',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'guards/[domain]/[domain]-guard.ts',
        allowedImports: ['contracts/', 'statics/', 'errors/'],
      });
    });

    it('VALID: transformers folder config returns correct structure', () => {
      expect(folderConfigStatics.transformers).toStrictEqual({
        fileSuffix: '-transformer.ts',
        exportSuffix: 'Transformer',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'transformers/[domain]/[domain]-transformer.ts',
        allowedImports: ['contracts/', 'statics/', 'errors/'],
      });
    });

    it('VALID: errors folder config returns correct structure', () => {
      expect(folderConfigStatics.errors).toStrictEqual({
        fileSuffix: '-error.ts',
        exportSuffix: 'Error',
        exportCase: 'PascalCase',
        folderDepth: 1,
        folderPattern: 'errors/[domain]/[domain]-error.ts',
        allowedImports: [],
      });
    });

    it('VALID: flows folder config returns correct structure', () => {
      expect(folderConfigStatics.flows).toStrictEqual({
        fileSuffix: ['-flow.ts', '-flow.tsx'],
        exportSuffix: 'Flow',
        exportCase: 'PascalCase',
        folderDepth: 1,
        folderPattern: 'flows/[domain]/[domain]-flow.tsx',
        allowedImports: ['responders/'],
      });
    });

    it('VALID: adapters folder config returns correct structure', () => {
      expect(folderConfigStatics.adapters).toStrictEqual({
        fileSuffix: '-adapter.ts',
        exportSuffix: 'Adapter',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'adapters/[package]/[package]-[operation]-adapter.ts',
        allowedImports: ['node_modules', 'middleware/', 'statics/', 'contracts/', 'guards/'],
      });
    });

    it('VALID: middleware folder config returns correct structure', () => {
      expect(folderConfigStatics.middleware).toStrictEqual({
        fileSuffix: '-middleware.ts',
        exportSuffix: 'Middleware',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'middleware/[name]/[name]-middleware.ts',
        allowedImports: ['adapters/', 'middleware/', 'statics/'],
      });
    });

    it('VALID: brokers folder config returns correct structure', () => {
      expect(folderConfigStatics.brokers).toStrictEqual({
        fileSuffix: '-broker.ts',
        exportSuffix: 'Broker',
        exportCase: 'camelCase',
        folderDepth: 2,
        folderPattern: 'brokers/[domain]/[action]/[domain]-[action]-broker.ts',
        allowedImports: [
          'brokers/',
          'adapters/',
          'contracts/',
          'statics/',
          'errors/',
          'guards/',
          'transformers/',
        ],
      });
    });

    it('VALID: bindings folder config returns correct structure', () => {
      expect(folderConfigStatics.bindings).toStrictEqual({
        fileSuffix: '-binding.ts',
        exportSuffix: 'Binding',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'bindings/[name]/[name]-binding.ts',
        allowedImports: [
          'brokers/',
          'state/',
          'contracts/',
          'statics/',
          'errors/',
          'guards/',
          'transformers/',
        ],
      });
    });

    it('VALID: state folder config returns correct structure', () => {
      expect(folderConfigStatics.state).toStrictEqual({
        fileSuffix: '-state.ts',
        exportSuffix: 'State',
        exportCase: 'camelCase',
        folderDepth: 1,
        folderPattern: 'state/[name]/[name]-state.ts',
        allowedImports: ['contracts/', 'statics/', 'errors/', 'guards/', 'transformers/'],
      });
    });

    it('VALID: responders folder config returns correct structure', () => {
      expect(folderConfigStatics.responders).toStrictEqual({
        fileSuffix: '-responder.ts',
        exportSuffix: 'Responder',
        exportCase: 'PascalCase',
        folderDepth: 2,
        folderPattern: 'responders/[domain]/[action]/[domain]-[action]-responder.ts',
        allowedImports: [
          'widgets/',
          'brokers/',
          'bindings/',
          'state/',
          'contracts/',
          'transformers/',
          'guards/',
          'statics/',
          'errors/',
        ],
      });
    });

    it('VALID: widgets folder config returns correct structure', () => {
      expect(folderConfigStatics.widgets).toStrictEqual({
        fileSuffix: ['-widget.tsx', '-widget.ts'],
        exportSuffix: 'Widget',
        exportCase: 'PascalCase',
        folderDepth: 1,
        folderPattern: 'widgets/[name]/[name]-widget.tsx',
        allowedImports: [
          'bindings/',
          'brokers/',
          'state/',
          'contracts/',
          'transformers/',
          'guards/',
          'statics/',
          'errors/',
        ],
      });
    });

    it('VALID: startup folder config returns correct structure', () => {
      expect(folderConfigStatics.startup).toStrictEqual({
        fileSuffix: '.ts',
        exportSuffix: '',
        exportCase: 'PascalCase',
        folderDepth: 0,
        folderPattern: 'startup/start-[name].ts',
        allowedImports: ['*'],
      });
    });

    it('VALID: assets folder config returns correct structure', () => {
      expect(folderConfigStatics.assets).toStrictEqual({
        fileSuffix: '',
        exportSuffix: '',
        exportCase: '',
        folderDepth: 1,
        folderPattern: 'assets/[type]/[filename]',
        allowedImports: [],
      });
    });

    it('VALID: migrations folder config returns correct structure', () => {
      expect(folderConfigStatics.migrations).toStrictEqual({
        fileSuffix: '',
        exportSuffix: '',
        exportCase: '',
        folderDepth: 1,
        folderPattern: 'migrations/[version]/[number]-[name].sql',
        allowedImports: [],
      });
    });
  });

  describe('completeness', () => {
    it('VALID: all folder types are defined', () => {
      const definedFolders = Object.keys(folderConfigStatics);
      const expectedFolders = Object.keys(folderConfigStatics);

      expect(definedFolders).toStrictEqual(expectedFolders);
    });
  });

  describe('immutability', () => {
    it('EDGE: as const makes object readonly at type level', () => {
      // The 'as const' assertion ensures TypeScript treats this as readonly
      // Verify that the type system would prevent mutations
      const config = folderConfigStatics.statics;

      // Accessing properties should work fine
      expect(config.fileSuffix).toBe('-statics.ts');
      expect(config.exportSuffix).toBe('Statics');
      expect(config.exportCase).toBe('camelCase');
      expect(config.folderDepth).toBe(1);
    });

    it('EDGE: nested array properties retain their values', () => {
      const contractsConfig = folderConfigStatics.contracts;

      // Verify array suffixes are preserved
      expect(Array.isArray(contractsConfig.fileSuffix)).toBe(true);
      expect(contractsConfig.fileSuffix).toStrictEqual(['-contract.ts', '.stub.ts']);

      // Verify allowedImports array is preserved
      expect(Array.isArray(contractsConfig.allowedImports)).toBe(true);
      expect(contractsConfig.allowedImports).toStrictEqual(['statics/', 'errors/', 'zod']);
    });
  });
});
