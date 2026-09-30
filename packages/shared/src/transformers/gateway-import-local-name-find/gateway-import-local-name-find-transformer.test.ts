import { gatewayImportLocalNameFindTransformer } from './gateway-import-local-name-find-transformer';

const FS_SOURCE = '#gateway/node/fs';
const TAIL_FILE = 'tailFile';

describe('gatewayImportLocalNameFindTransformer', () => {
  describe('named import present', () => {
    it("VALID: {import { tailFile } from '#gateway/node/fs'} => returns tailFile", () => {
      const result = gatewayImportLocalNameFindTransformer({
        source: "import { tailFile } from '#gateway/node/fs';\ntailFile({ path: p });",
        importSource: FS_SOURCE,
        importedName: TAIL_FILE,
      });

      expect(result).toBe('tailFile');
    });

    it('VALID: {aliased import} => returns the local alias', () => {
      const result = gatewayImportLocalNameFindTransformer({
        source: "import { tailFile as tail } from '#gateway/node/fs';",
        importSource: FS_SOURCE,
        importedName: TAIL_FILE,
      });

      expect(result).toBe('tail');
    });

    it('VALID: {multi-line specifier list with a sibling name} => returns the wanted name', () => {
      const result = gatewayImportLocalNameFindTransformer({
        source: "import {\n  readFileSync,\n  tailFile,\n} from '#gateway/node/fs';",
        importSource: FS_SOURCE,
        importedName: TAIL_FILE,
      });

      expect(result).toBe('tailFile');
    });
  });

  describe('named import absent', () => {
    it('EMPTY: {same name imported from another specifier} => returns undefined', () => {
      const result = gatewayImportLocalNameFindTransformer({
        source: "import { tailFile } from './local-tail';",
        importSource: FS_SOURCE,
        importedName: TAIL_FILE,
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {same specifier, different name} => returns undefined', () => {
      const result = gatewayImportLocalNameFindTransformer({
        source: "import { readFileSync } from '#gateway/node/fs';",
        importSource: FS_SOURCE,
        importedName: TAIL_FILE,
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {type-only import} => returns undefined', () => {
      const result = gatewayImportLocalNameFindTransformer({
        source: "import type { tailFile } from '#gateway/node/fs';",
        importSource: FS_SOURCE,
        importedName: TAIL_FILE,
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {fs__promises specifier when fs is asked} => returns undefined', () => {
      const result = gatewayImportLocalNameFindTransformer({
        source: "import { tailFile } from '#gateway/node/fs__promises';",
        importSource: FS_SOURCE,
        importedName: TAIL_FILE,
      });

      expect(result).toBe(undefined);
    });
  });
});
