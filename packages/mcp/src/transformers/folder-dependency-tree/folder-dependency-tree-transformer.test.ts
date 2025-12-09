import { folderDependencyTreeTransformer } from './folder-dependency-tree-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { FolderConfigStub } from '@dungeonmaster/shared/contracts';

const FolderConfigsStub = (
  configs: Record<PropertyKey, ReturnType<typeof FolderConfigStub>>,
): Parameters<typeof folderDependencyTreeTransformer>[0]['folderConfigs'] => {
  // Cast is safe: test stubs have compatible structure with folderConfigStatics values
  // The branded types from FolderConfigStub match the literal types from folderConfigStatics at runtime
  return configs as unknown as Parameters<
    typeof folderDependencyTreeTransformer
  >[0]['folderConfigs'];
};

const buildMatrixStub = ({
  folders,
  dependencies,
}: {
  folders: readonly string[];
  dependencies: Record<string, readonly string[]>;
}) => {
  const columnWidth = 12;
  const sortedFolders = [...folders].sort();

  const headerCells = ['FROM \\ TO', ...sortedFolders];
  const header = headerCells
    .map((cell) => {
      return cell.padEnd(columnWidth);
    })
    .join(' | ');

  const separator = headerCells
    .map(() => {
      return '-'.repeat(columnWidth);
    })
    .join('-+-');

  const rows = sortedFolders.map((fromFolder) => {
    const cells = [fromFolder.padEnd(columnWidth)];

    for (const toFolder of sortedFolders) {
      const canImport = dependencies[fromFolder]?.includes(toFolder) ?? false;
      const mark = canImport ? '✓' : '';
      cells.push(mark.padEnd(columnWidth));
    }

    return cells.join(' | ');
  });

  return ContentTextStub({
    value: [header, separator, ...rows].join('\n'),
  });
};

describe('folderDependencyTreeTransformer', () => {
  describe('with single folder with no imports', () => {
    it('VALID: {folderConfigs: {statics: {allowedImports: []}}} => returns hierarchy and graph', () => {
      const folderConfigs = FolderConfigsStub({
        statics: FolderConfigStub({ allowedImports: [] }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: 'statics/          # Can import: nothing (leaf node)',
        }),
        graph: {
          statics: [],
        },
        matrix: buildMatrixStub({
          folders: ['statics'],
          dependencies: { statics: [] },
        }),
      });
    });
  });

  describe('with single folder with one import', () => {
    it('VALID: {folderConfigs: {guards: {allowedImports: ["statics/"]}}} => returns hierarchy showing dependency', () => {
      const folderConfigs = FolderConfigsStub({
        guards: FolderConfigStub({ allowedImports: ['statics/'] }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: 'guards/          # Can import: statics',
        }),
        graph: {
          guards: ['statics'],
        },
        matrix: buildMatrixStub({
          folders: ['guards'],
          dependencies: { guards: ['statics'] },
        }),
      });
    });
  });

  describe('with multiple folders', () => {
    it('VALID: {folderConfigs: {statics, contracts, guards}} => returns all 3 formats sorted by imports', () => {
      const folderConfigs = FolderConfigsStub({
        statics: FolderConfigStub({ allowedImports: [] }),
        contracts: FolderConfigStub({ allowedImports: ['statics/'] }),
        guards: FolderConfigStub({ allowedImports: ['contracts/', 'statics/'] }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: `statics/          # Can import: nothing (leaf node)
contracts/          # Can import: statics
guards/          # Can import: contracts, statics`,
        }),
        graph: {
          statics: [],
          contracts: ['statics'],
          guards: ['contracts', 'statics'],
        },
        matrix: buildMatrixStub({
          folders: ['statics', 'contracts', 'guards'],
          dependencies: {
            statics: [],
            contracts: ['statics'],
            guards: ['contracts', 'statics'],
          },
        }),
      });
    });
  });

  describe('with wildcard imports', () => {
    it('VALID: {folderConfigs: {startup: {allowedImports: ["*"]}}} => filters out wildcard from output', () => {
      const folderConfigs = FolderConfigsStub({
        statics: FolderConfigStub({ allowedImports: [] }),
        startup: FolderConfigStub({ allowedImports: ['*'] }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: `statics/          # Can import: nothing (leaf node)
startup/          # Can import: nothing (leaf node)`,
        }),
        graph: {
          statics: [],
          startup: [],
        },
        matrix: buildMatrixStub({
          folders: ['statics', 'startup'],
          dependencies: {
            statics: [],
            startup: [],
          },
        }),
      });
    });
  });

  describe('with complex dependency tree', () => {
    it('VALID: {folderConfigs: {statics, guards, transformers, brokers}} => returns complete visualization', () => {
      const folderConfigs = FolderConfigsStub({
        statics: FolderConfigStub({ allowedImports: [] }),
        guards: FolderConfigStub({ allowedImports: ['contracts/', 'statics/'] }),
        transformers: FolderConfigStub({ allowedImports: ['guards/', 'contracts/', 'statics/'] }),
        brokers: FolderConfigStub({
          allowedImports: ['transformers/', 'guards/', 'contracts/', 'statics/'],
        }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: `statics/          # Can import: nothing (leaf node)
guards/          # Can import: contracts, statics
transformers/          # Can import: guards, contracts, statics
brokers/          # Can import: transformers, guards, contracts, statics`,
        }),
        graph: {
          statics: [],
          guards: ['contracts', 'statics'],
          transformers: ['guards', 'contracts', 'statics'],
          brokers: ['transformers', 'guards', 'contracts', 'statics'],
        },
        matrix: buildMatrixStub({
          folders: ['statics', 'guards', 'transformers', 'brokers'],
          dependencies: {
            statics: [],
            guards: ['contracts', 'statics'],
            transformers: ['guards', 'contracts', 'statics'],
            brokers: ['transformers', 'guards', 'contracts', 'statics'],
          },
        }),
      });
    });
  });

  describe('with missing config entries', () => {
    it('EDGE: {folderConfigs: with undefined config} => skips undefined entries', () => {
      const folderConfigs = FolderConfigsStub({
        statics: FolderConfigStub({ allowedImports: [] }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: 'statics/          # Can import: nothing (leaf node)',
        }),
        graph: {
          statics: [],
        },
        matrix: buildMatrixStub({
          folders: ['statics'],
          dependencies: { statics: [] },
        }),
      });
    });
  });

  describe('with empty folderConfigs', () => {
    it('EMPTY: {folderConfigs: {}} => returns empty visualizations', () => {
      const folderConfigs = FolderConfigsStub({});

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({ value: '' }),
        graph: {},
        matrix: buildMatrixStub({
          folders: [],
          dependencies: {},
        }),
      });
    });
  });

  describe('with trailing slashes in imports', () => {
    it('VALID: {allowedImports: ["statics/", "contracts/"]} => normalizes by removing trailing slashes', () => {
      const folderConfigs = FolderConfigsStub({
        guards: FolderConfigStub({ allowedImports: ['statics/', 'contracts/'] }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: 'guards/          # Can import: statics, contracts',
        }),
        graph: {
          guards: ['statics', 'contracts'],
        },
        matrix: buildMatrixStub({
          folders: ['guards'],
          dependencies: { guards: ['statics', 'contracts'] },
        }),
      });
    });
  });

  describe('with node_modules import', () => {
    it('VALID: {allowedImports: ["node_modules", "statics/"]} => includes node_modules in output', () => {
      const folderConfigs = FolderConfigsStub({
        adapters: FolderConfigStub({ allowedImports: ['node_modules', 'statics/'] }),
      });

      const result = folderDependencyTreeTransformer({ folderConfigs });

      expect(result).toStrictEqual({
        hierarchy: ContentTextStub({
          value: 'adapters/          # Can import: node_modules, statics',
        }),
        graph: {
          adapters: ['node_modules', 'statics'],
        },
        matrix: buildMatrixStub({
          folders: ['adapters'],
          dependencies: { adapters: ['node_modules', 'statics'] },
        }),
      });
    });
  });
});
