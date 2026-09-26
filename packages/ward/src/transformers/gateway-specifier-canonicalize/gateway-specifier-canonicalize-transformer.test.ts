import { gatewaySpecifierCanonicalizeTransformer } from './gateway-specifier-canonicalize-transformer';
import { ModuleSpecifierStub } from '../../contracts/module-specifier/module-specifier.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';

describe('gatewaySpecifierCanonicalizeTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {"#gateway/node/fs", a known @gateway/node package} => returns "@dungeonmaster/node/fs"', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: '#gateway/node/fs' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
      });

      expect(result).toBe('@dungeonmaster/node/fs');
    });

    it('VALID: {"#gateway/browser/localStorage", a known @gateway/browser package} => returns "@dungeonmaster/browser/localStorage"', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: '#gateway/browser/localStorage' }),
        knownPackages: [
          ProjectFolderStub({
            name: '@dungeonmaster/browser',
            path: '/repo/packages/@gateway/browser',
          }),
        ],
      });

      expect(result).toBe('@dungeonmaster/browser/localStorage');
    });

    it('VALID: {"#gateway/node", no subpath, a known @gateway/node package} => returns "@dungeonmaster/node"', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: '#gateway/node' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
      });

      expect(result).toBe('@dungeonmaster/node');
    });
  });

  describe('passthrough for non-gateway specifiers', () => {
    it('VALID: {"@dungeonmaster/shared2/brokers", an ordinary bare specifier} => returns it unchanged', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: '@dungeonmaster/shared2/brokers' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/shared2', path: '/repo/packages/shared2' }),
        ],
      });

      expect(result).toBe('@dungeonmaster/shared2/brokers');
    });

    it('VALID: {"./sibling", a relative specifier} => returns it unchanged', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: './sibling' }),
        knownPackages: [],
      });

      expect(result).toBe('./sibling');
    });
  });

  describe('unmapped # specifiers', () => {
    it('INVALID: {"#gateway/unknown-folder/x", no known package for that folder} => returns it unchanged', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: '#gateway/unknown-folder/x' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
      });

      expect(result).toBe('#gateway/unknown-folder/x');
    });

    it('INVALID: {"#gateway/node/fs", no known packages at all} => returns it unchanged', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: '#gateway/node/fs' }),
        knownPackages: [],
      });

      expect(result).toBe('#gateway/node/fs');
    });

    it('INVALID: {"#internal/other-feature", a # specifier outside the gateway prefix} => returns it unchanged', () => {
      const result = gatewaySpecifierCanonicalizeTransformer({
        specifier: ModuleSpecifierStub({ value: '#internal/other-feature' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
      });

      expect(result).toBe('#internal/other-feature');
    });
  });
});
