import { moduleDependencyContract } from './module-dependency-contract';
import { ModuleDependencyStub } from './module-dependency.stub';

describe('moduleDependencyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {kind: "named"} => parses successfully', () => {
      const result = moduleDependencyContract.parse(
        ModuleDependencyStub({ specifier: '@dungeonmaster/node/fs', importedNames: ['readFile'] }),
      );

      expect(result).toStrictEqual({
        specifier: '@dungeonmaster/node/fs',
        kind: 'named',
        importedNames: ['readFile'],
      });
    });

    it('VALID: {kind: "star", importedNames: []} => parses successfully', () => {
      const result = moduleDependencyContract.parse(
        ModuleDependencyStub({ specifier: './barrel', kind: 'star', importedNames: [] }),
      );

      expect(result).toStrictEqual({ specifier: './barrel', kind: 'star', importedNames: [] });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {kind: "unknown"} => throws validation error', () => {
      expect(() =>
        moduleDependencyContract.parse(ModuleDependencyStub({ kind: 'unknown' })),
      ).toThrow(/Invalid option/u);
    });

    it('INVALID: {missing specifier} => throws validation error', () => {
      expect(() => moduleDependencyContract.parse({ kind: 'named', importedNames: [] })).toThrow(
        /received undefined/u,
      );
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a named dependency', () => {
      const result = ModuleDependencyStub();

      expect(result).toStrictEqual({ specifier: './foo', kind: 'named', importedNames: ['foo'] });
    });
  });
});
