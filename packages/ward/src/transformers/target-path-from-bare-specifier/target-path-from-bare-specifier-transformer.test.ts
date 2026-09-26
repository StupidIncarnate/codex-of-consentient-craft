import { targetPathFromBareSpecifierTransformer } from './target-path-from-bare-specifier-transformer';
import { ModuleSpecifierStub } from '../../contracts/module-specifier/module-specifier.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';

describe('targetPathFromBareSpecifierTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {specifier with a subpath, matching known package} => appends the subpath', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: ModuleSpecifierStub({ value: '@dungeonmaster/shared2/brokers' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/shared2', path: '/repo/packages/shared2' }),
        ],
      });

      expect(result).toBe('/repo/packages/shared2/brokers');
    });

    it('VALID: {bare package specifier, no subpath} => returns the package folder itself', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: ModuleSpecifierStub({ value: '@dungeonmaster/shared2' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/shared2', path: '/repo/packages/shared2' }),
        ],
      });

      expect(result).toBe('/repo/packages/shared2');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no known package matches} => returns undefined', () => {
      const result = targetPathFromBareSpecifierTransformer({
        specifier: ModuleSpecifierStub({ value: 'react' }),
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/shared2', path: '/repo/packages/shared2' }),
        ],
      });

      expect(result).toBe(undefined);
    });
  });
});
