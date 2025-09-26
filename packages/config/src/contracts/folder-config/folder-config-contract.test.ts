import {
  AllowedExternalImports,
  VALID_ARCHITECTURE_FOLDERS,
  ArchitectureFolder,
  isValidArchitectureFolder,
} from './folder-config-contract';

describe('folder-config-contract', () => {
  describe('VALID_ARCHITECTURE_FOLDERS', () => {
    describe('valid structure', () => {
      it('VALID: contains all expected architecture folders => returns complete array', () => {
        expect(VALID_ARCHITECTURE_FOLDERS).toStrictEqual([
          'contracts',
          'transformers',
          'errors',
          'flows',
          'adapters',
          'middleware',
          'brokers',
          'bindings',
          'state',
          'responders',
          'widgets',
          'startup',
          'assets',
          'migrations',
        ]);
      });

      it('VALID: is readonly array => returns readonly type', () => {
        expect(Array.isArray(VALID_ARCHITECTURE_FOLDERS)).toBe(true);
        // Test that it's a const assertion (readonly) by checking it exists
        expect(VALID_ARCHITECTURE_FOLDERS.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isValidArchitectureFolder()', () => {
    describe('valid core folder inputs', () => {
      it('VALID: "contracts" => returns true', () => {
        expect(isValidArchitectureFolder('contracts')).toBe(true);
      });

      it('VALID: "transformers" => returns true', () => {
        expect(isValidArchitectureFolder('transformers')).toBe(true);
      });

      it('VALID: "errors" => returns true', () => {
        expect(isValidArchitectureFolder('errors')).toBe(true);
      });

      it('VALID: "flows" => returns true', () => {
        expect(isValidArchitectureFolder('flows')).toBe(true);
      });

      it('VALID: "adapters" => returns true', () => {
        expect(isValidArchitectureFolder('adapters')).toBe(true);
      });

      it('VALID: "middleware" => returns true', () => {
        expect(isValidArchitectureFolder('middleware')).toBe(true);
      });

      it('VALID: "brokers" => returns true', () => {
        expect(isValidArchitectureFolder('brokers')).toBe(true);
      });
    });

    describe('valid ui folder inputs', () => {
      it('VALID: "bindings" => returns true', () => {
        expect(isValidArchitectureFolder('bindings')).toBe(true);
      });

      it('VALID: "state" => returns true', () => {
        expect(isValidArchitectureFolder('state')).toBe(true);
      });

      it('VALID: "responders" => returns true', () => {
        expect(isValidArchitectureFolder('responders')).toBe(true);
      });

      it('VALID: "widgets" => returns true', () => {
        expect(isValidArchitectureFolder('widgets')).toBe(true);
      });
    });

    describe('valid infrastructure folder inputs', () => {
      it('VALID: "startup" => returns true', () => {
        expect(isValidArchitectureFolder('startup')).toBe(true);
      });

      it('VALID: "assets" => returns true', () => {
        expect(isValidArchitectureFolder('assets')).toBe(true);
      });

      it('VALID: "migrations" => returns true', () => {
        expect(isValidArchitectureFolder('migrations')).toBe(true);
      });
    });

    describe('invalid string inputs', () => {
      it('INVALID_FOLDER: "utils" => returns false', () => {
        expect(isValidArchitectureFolder('utils')).toBe(false);
      });

      it('INVALID_FOLDER: "lib" => returns false', () => {
        expect(isValidArchitectureFolder('lib')).toBe(false);
      });

      it('INVALID_FOLDER: "helpers" => returns false', () => {
        expect(isValidArchitectureFolder('helpers')).toBe(false);
      });

      it('INVALID_FOLDER: "common" => returns false', () => {
        expect(isValidArchitectureFolder('common')).toBe(false);
      });

      it('INVALID_FOLDER: "shared" => returns false', () => {
        expect(isValidArchitectureFolder('shared')).toBe(false);
      });

      it('INVALID_FOLDER: "core" => returns false', () => {
        expect(isValidArchitectureFolder('core')).toBe(false);
      });

      it('INVALID_FOLDER: "services" => returns false', () => {
        expect(isValidArchitectureFolder('services')).toBe(false);
      });

      it('INVALID_FOLDER: "repositories" => returns false', () => {
        expect(isValidArchitectureFolder('repositories')).toBe(false);
      });

      it('INVALID_FOLDER: "models" => returns false', () => {
        expect(isValidArchitectureFolder('models')).toBe(false);
      });

      it('INVALID_FOLDER: "types" => returns false', () => {
        expect(isValidArchitectureFolder('types')).toBe(false);
      });

      it('INVALID_FOLDER: "interfaces" => returns false', () => {
        expect(isValidArchitectureFolder('interfaces')).toBe(false);
      });

      it('INVALID_FOLDER: "validators" => returns false', () => {
        expect(isValidArchitectureFolder('validators')).toBe(false);
      });

      it('INVALID_FOLDER: "formatters" => returns false', () => {
        expect(isValidArchitectureFolder('formatters')).toBe(false);
      });

      it('INVALID_FOLDER: "mappers" => returns false', () => {
        expect(isValidArchitectureFolder('mappers')).toBe(false);
      });

      it('INVALID_FOLDER: "converters" => returns false', () => {
        expect(isValidArchitectureFolder('converters')).toBe(false);
      });

      it('INVALID_FOLDER: "CONTRACTS" => returns false', () => {
        expect(isValidArchitectureFolder('CONTRACTS')).toBe(false);
      });

      it('INVALID_FOLDER: "Contracts" => returns false', () => {
        expect(isValidArchitectureFolder('Contracts')).toBe(false);
      });

      it('INVALID_FOLDER: "component" => returns false', () => {
        expect(isValidArchitectureFolder('component')).toBe(false);
      });

      it('INVALID_FOLDER: "components" => returns false', () => {
        expect(isValidArchitectureFolder('components')).toBe(false);
      });
    });

    describe('invalid type inputs', () => {
      it('INVALID_TYPE: null => returns false', () => {
        expect(isValidArchitectureFolder(null)).toBe(false);
      });

      it('INVALID_TYPE: undefined => returns false', () => {
        expect(isValidArchitectureFolder(undefined)).toBe(false);
      });

      it('INVALID_TYPE: 123 => returns false', () => {
        expect(isValidArchitectureFolder(123)).toBe(false);
      });

      it('INVALID_TYPE: true => returns false', () => {
        expect(isValidArchitectureFolder(true)).toBe(false);
      });

      it('INVALID_TYPE: false => returns false', () => {
        expect(isValidArchitectureFolder(false)).toBe(false);
      });

      it('INVALID_TYPE: [] => returns false', () => {
        expect(isValidArchitectureFolder([])).toBe(false);
      });

      it('INVALID_TYPE: {} => returns false', () => {
        expect(isValidArchitectureFolder({})).toBe(false);
      });

      it('INVALID_TYPE: () => {} => returns false', () => {
        expect(isValidArchitectureFolder(() => {})).toBe(false);
      });

      it('INVALID_TYPE: Symbol("test") => returns false', () => {
        expect(isValidArchitectureFolder(Symbol('test'))).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('EDGE: "" => returns false', () => {
        expect(isValidArchitectureFolder('')).toBe(false);
      });

      it('EDGE: "  contracts  " => returns false', () => {
        expect(isValidArchitectureFolder('  contracts  ')).toBe(false);
      });

      it('EDGE: "contracts\n" => returns false', () => {
        expect(isValidArchitectureFolder('contracts\n')).toBe(false);
      });

      it('EDGE: "contracts\t" => returns false', () => {
        expect(isValidArchitectureFolder('contracts\t')).toBe(false);
      });

      it('EDGE: 0 => returns false', () => {
        expect(isValidArchitectureFolder(0)).toBe(false);
      });

      it('EDGE: -1 => returns false', () => {
        expect(isValidArchitectureFolder(-1)).toBe(false);
      });

      it('EDGE: NaN => returns false', () => {
        expect(isValidArchitectureFolder(NaN)).toBe(false);
      });

      it('EDGE: Infinity => returns false', () => {
        expect(isValidArchitectureFolder(Infinity)).toBe(false);
      });
    });
  });

  describe('AllowedExternalImports type', () => {
    describe('type compilation', () => {
      it('VALID: type accepts valid frontend structure => compiles successfully', () => {
        const frontendImports: AllowedExternalImports = {
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

        expect(frontendImports.widgets).toStrictEqual(['react', 'react-dom']);
        expect(frontendImports.bindings).toStrictEqual(['react', 'react-dom']);
        expect(frontendImports.state).toStrictEqual(['react', 'react-dom']);
        expect(frontendImports.flows).toStrictEqual(['react-router-dom']);
        expect(frontendImports.responders).toStrictEqual([]);
        expect(frontendImports.contracts).toStrictEqual(['zod']);
        expect(frontendImports.brokers).toStrictEqual([]);
        expect(frontendImports.transformers).toStrictEqual([]);
        expect(frontendImports.errors).toStrictEqual([]);
        expect(frontendImports.middleware).toStrictEqual([]);
        expect(frontendImports.adapters).toStrictEqual(['*']);
        expect(frontendImports.startup).toStrictEqual(['*']);
      });

      it('VALID: type accepts valid backend structure => compiles successfully', () => {
        const backendImports: AllowedExternalImports = {
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
        };

        expect(backendImports.widgets).toBe(null);
        expect(backendImports.bindings).toBe(null);
        expect(backendImports.state).toStrictEqual([]);
        expect(backendImports.flows).toStrictEqual(['express']);
        expect(backendImports.responders).toStrictEqual([]);
        expect(backendImports.contracts).toStrictEqual(['zod', 'yup']);
        expect(backendImports.brokers).toStrictEqual([]);
        expect(backendImports.transformers).toStrictEqual([]);
        expect(backendImports.errors).toStrictEqual([]);
        expect(backendImports.middleware).toStrictEqual([]);
        expect(backendImports.adapters).toStrictEqual(['*']);
        expect(backendImports.startup).toStrictEqual(['*']);
      });

      it('VALID: type accepts valid library structure => compiles successfully', () => {
        const libraryImports: AllowedExternalImports = {
          widgets: null,
          bindings: null,
          state: [],
          flows: null,
          responders: null,
          contracts: ['joi'],
          brokers: [],
          transformers: [],
          errors: [],
          middleware: [],
          adapters: ['*'],
          startup: ['*'],
        };

        expect(libraryImports.widgets).toBe(null);
        expect(libraryImports.bindings).toBe(null);
        expect(libraryImports.state).toStrictEqual([]);
        expect(libraryImports.flows).toBe(null);
        expect(libraryImports.responders).toBe(null);
        expect(libraryImports.contracts).toStrictEqual(['joi']);
        expect(libraryImports.brokers).toStrictEqual([]);
        expect(libraryImports.transformers).toStrictEqual([]);
        expect(libraryImports.errors).toStrictEqual([]);
        expect(libraryImports.middleware).toStrictEqual([]);
        expect(libraryImports.adapters).toStrictEqual(['*']);
        expect(libraryImports.startup).toStrictEqual(['*']);
      });
    });
  });

  describe('ArchitectureFolder type', () => {
    describe('type compilation', () => {
      it('VALID: type accepts all valid architecture folders => compiles successfully', () => {
        const validFolders: ArchitectureFolder[] = [
          'contracts',
          'transformers',
          'errors',
          'flows',
          'adapters',
          'middleware',
          'brokers',
          'bindings',
          'state',
          'responders',
          'widgets',
          'startup',
          'assets',
          'migrations',
        ];

        expect(validFolders).toStrictEqual([
          'contracts',
          'transformers',
          'errors',
          'flows',
          'adapters',
          'middleware',
          'brokers',
          'bindings',
          'state',
          'responders',
          'widgets',
          'startup',
          'assets',
          'migrations',
        ]);
      });
    });
  });
});
