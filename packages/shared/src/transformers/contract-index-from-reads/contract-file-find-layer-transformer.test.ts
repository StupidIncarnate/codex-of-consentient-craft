import { ContractIndexFileReadStub } from '../../contracts/contract-index-file-read/contract-index-file-read.stub';
import { ContractIndexPackageStub } from '../../contracts/contract-index-package/contract-index-package.stub';
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
        specifier: '@repo/shared/src/thing/thing-contract',
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map(),
        knownFiles: new Set([contractFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('EMPTY: {specifier resolves to nothing} => returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: 'zod',
        fromFile: importer,
        name: 'z',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map(),
        knownFiles: new Set([contractFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('through barrels', () => {
    it('VALID: {named re-export with a rename} => follows the source name to the contract file', () => {
      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/contracts',
        fromFile: importer,
        name: 'renamedContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map([
          [
            barrelFile,
            ContractIndexFileReadStub({
              reExports: [
                {
                  kind: 'named',
                  exportedName: 'renamedContract',
                  sourceName: 'thingContract',
                  specifier: './src/thing/thing-contract',
                },
              ],
            }).reExports,
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('VALID: {star re-export} => follows the same name to the contract file', () => {
      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/contracts',
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map([
          [
            barrelFile,
            ContractIndexFileReadStub({
              reExports: [
                {
                  kind: 'star',
                  exportedName: '*',
                  sourceName: '*',
                  specifier: './src/thing/thing-contract',
                },
              ],
            }).reExports,
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('VALID: {star barrel listing two contract files} => returns the file that exports the name, not the first', () => {
      const firstContractFile = '/repo/packages/shared/src/first/first-contract.ts';

      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/contracts',
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
            ContractIndexFileReadStub({
              reExports: [
                {
                  kind: 'star',
                  exportedName: '*',
                  sourceName: '*',
                  specifier: './src/first/first-contract',
                },
                {
                  kind: 'star',
                  exportedName: '*',
                  sourceName: '*',
                  specifier: './src/thing/thing-contract',
                },
              ],
            }).reExports,
          ],
        ]),
        knownFiles: new Set([firstContractFile, contractFile, barrelFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('VALID: {contract file that does not export the name} => returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/src/thing/thing-contract',
        fromFile: importer,
        name: 'otherContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map(),
        knownFiles: new Set([contractFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {named re-export of a different name} => skips it and returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/contracts',
        fromFile: importer,
        name: 'wantedContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map([
          [
            barrelFile,
            ContractIndexFileReadStub({
              reExports: [
                {
                  kind: 'named',
                  exportedName: 'thingContract',
                  sourceName: 'thingContract',
                  specifier: './src/thing/thing-contract',
                },
              ],
            }).reExports,
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {two barrels that star-export each other} => stops and returns undefined', () => {
      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/contracts',
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map([
          [
            barrelFile,
            ContractIndexFileReadStub({
              reExports: [
                {
                  kind: 'star',
                  exportedName: '*',
                  sourceName: '*',
                  specifier: './more',
                },
              ],
            }).reExports,
          ],
          [
            otherBarrelFile,
            ContractIndexFileReadStub({
              reExports: [
                {
                  kind: 'star',
                  exportedName: '*',
                  sourceName: '*',
                  specifier: './contracts',
                },
              ],
            }).reExports,
          ],
        ]),
        knownFiles: new Set([contractFile, barrelFile, otherBarrelFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map(),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('remembered resolutions', () => {
    it('VALID: {resolvedTargets already holds the specifier} => answers from it, not from knownFiles', () => {
      const resolvedTargets = new Map<string, string | null>([
        [`${importer}\0@repo/shared/src/thing/thing-contract`, contractFile],
      ]);

      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/src/thing/thing-contract',
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map(),
        knownFiles: new Set(),
        packages: [sharedPackage],
        resolvedTargets,
        foundTargets: new Map(),
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });

    it('VALID: {a fresh resolution} => remembers it, null for a specifier that names nothing', () => {
      const resolvedTargets = new Map<string, string | null>();

      contractFileFindLayerTransformer({
        specifier: 'zod',
        fromFile: importer,
        name: 'z',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map(),
        knownFiles: new Set([contractFile]),
        packages: [sharedPackage],
        resolvedTargets,
        foundTargets: new Map(),
      });

      expect([...resolvedTargets]).toStrictEqual([[`${importer}\0zod`, null]]);
    });
  });

  describe('remembered searches', () => {
    it('VALID: {foundTargets already holds the barrel and name} => answers from it without following links', () => {
      const result = contractFileFindLayerTransformer({
        specifier: '@repo/shared/contracts',
        fromFile: importer,
        name: 'thingContract',
        contractFiles: new Set([contractFile]),
        exportedNamesByFile: new Map([[contractFile, ['thingContract']]]),
        reExportsByFile: new Map(),
        knownFiles: new Set([barrelFile]),
        packages: [sharedPackage],
        resolvedTargets: new Map(),
        foundTargets: new Map([[`${barrelFile}\0thingContract`, contractFile]]),
      });

      expect(result).toBe('/repo/packages/shared/src/thing/thing-contract.ts');
    });
  });
});
