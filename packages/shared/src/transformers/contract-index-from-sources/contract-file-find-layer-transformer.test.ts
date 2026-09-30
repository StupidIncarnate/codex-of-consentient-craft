import { ContractIndexPackageStub } from '../../contracts/contract-index-package/contract-index-package.stub';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';
import { contractFileFindLayerTransformer } from './contract-file-find-layer-transformer';

const sharedPackage = ContractIndexPackageStub({
  name: '@repo/shared',
  dir: '/repo/packages/shared',
});
const importer = '/repo/packages/other/src/a.ts';
const contractFile = '/repo/packages/shared/src/thing/thing-contract.ts';
const barrelFile = '/repo/packages/shared/contracts.ts';
const otherBarrelFile = '/repo/packages/shared/more.ts';

describe('contractFileFindLayerTransformer', () => {
  describe('direct hits', () => {
    it('VALID: {specifier resolves to a contract file} => returns that file', () => {
      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/src/thing/thing-contract' }),
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map(),
        knownFiles: new Set([contractFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('EMPTY: {specifier resolves to nothing} => returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: 'zod' }),
        fromFile: importer,
        name: 'z',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map(),
        knownFiles: new Set([contractFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe(undefined);
    });
  });

  describe('through barrels', () => {
    it('VALID: {named re-export with a rename} => follows the source name to the contract file', () => {
      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/contracts' }),
        fromFile: importer,
        name: 'renamedContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map([
          [
            barrelFile,
            [
              {
                kind: 'named' as const,
                exportedName: 'renamedContract',
                sourceName: 'thingContract',
                specifier: ImportPathStub({ value: './src/thing/thing-contract' }),
              },
            ],
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('VALID: {star re-export} => follows the same name to the contract file', () => {
      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/contracts' }),
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map([
          [
            barrelFile,
            [
              {
                kind: 'star' as const,
                exportedName: '*',
                sourceName: '*',
                specifier: ImportPathStub({ value: './src/thing/thing-contract' }),
              },
            ],
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('VALID: {star barrel listing two contract files} => returns the file that exports the name, not the first', () => {
      const firstContractFile = '/repo/packages/shared/src/first/first-contract.ts';

      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/contracts' }),
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([firstContractFile, contractFile]),
        exportedNamesByFile: new Map([
          [firstContractFile, ['firstContract']],
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map([
          [
            barrelFile,
            [
              {
                kind: 'star' as const,
                exportedName: '*',
                sourceName: '*',
                specifier: ImportPathStub({ value: './src/first/first-contract' }),
              },
              {
                kind: 'star' as const,
                exportedName: '*',
                sourceName: '*',
                specifier: ImportPathStub({ value: './src/thing/thing-contract' }),
              },
            ],
          ],
        ]),
        knownFiles: new Set([firstContractFile, contractFile, barrelFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('VALID: {contract file that does not export the name} => returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/src/thing/thing-contract' }),
        fromFile: importer,
        name: 'otherContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map(),
        knownFiles: new Set([contractFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {named re-export of a different name} => skips it and returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/contracts' }),
        fromFile: importer,
        name: 'wantedContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map([
          [
            barrelFile,
            [
              {
                kind: 'named' as const,
                exportedName: 'thingContract',
                sourceName: 'thingContract',
                specifier: ImportPathStub({ value: './src/thing/thing-contract' }),
              },
            ],
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {two barrels that star-export each other} => stops and returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/contracts' }),
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([
          [contractFile, ['thingContract']],
        ]),
        reExportsByFile: new Map([
          [
            barrelFile,
            [
              {
                kind: 'star' as const,
                exportedName: '*',
                sourceName: '*',
                specifier: ImportPathStub({ value: './more' }),
              },
            ],
          ],
          [
            otherBarrelFile,
            [
              {
                kind: 'star' as const,
                exportedName: '*',
                sourceName: '*',
                specifier: ImportPathStub({ value: './contracts' }),
              },
            ],
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile, otherBarrelFile]),
        packages: [sharedPackage],
      });

      expect(result).toBe(undefined);
    });
  });
});
