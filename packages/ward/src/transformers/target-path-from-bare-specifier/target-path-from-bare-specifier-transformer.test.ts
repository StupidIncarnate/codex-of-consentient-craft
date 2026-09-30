import { targetPathFromBareSpecifierTransformer } from './target-path-from-bare-specifier-transformer';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';

describe('targetPathFromBareSpecifierTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {specifier with a subpath, matching known package} => appends the subpath', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: '@dungeonmaster/shared2/brokers',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/shared2', path: '/repo/packages/shared2' }),
        ],
      });

      expect(result).toBe('/repo/packages/shared2/brokers');
    });

    it('VALID: {bare package specifier, no subpath} => returns the package folder itself', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: '@dungeonmaster/shared2',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/shared2', path: '/repo/packages/shared2' }),
        ],
      });

      expect(result).toBe('/repo/packages/shared2');
    });

    it('VALID: {"#gateway/node/fs", a known @gateway/node package} => appends /src and the subpath', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: '#gateway/node/fs',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
      });

      expect(result).toBe('/repo/packages/@gateway/node/src/fs');
    });

    it('VALID: {"@dungeonmaster/node/fs", the same @gateway/node package} => appends /src and the subpath too', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: '@dungeonmaster/node/fs',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
      });

      expect(result).toBe('/repo/packages/@gateway/node/src/fs');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no known package matches} => returns undefined', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: 'react',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/shared2', path: '/repo/packages/shared2' }),
        ],
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {"#gateway/unknown-folder/x", no known package for that folder} => returns undefined', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: '#gateway/unknown-folder/x',
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
      });

      expect(result).toBe(undefined);
    });
  });
});
